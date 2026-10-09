import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { CLI_VERSION } from "../version";
import { compareVersions, detect, type PackageManager, type ProjectInfo } from "./detect";
import { loadConfig } from "../load-config";
import { planInit, previewLines, fsView, type Action, type Answers } from "./plan";
import { ApplyError, applyPlan, defaultApplyDeps, type ApplyDeps, type ApplyResult } from "./apply";
import { parseInitFlags, isInteractive, isAgent, reproduceCommand, type InitFlags } from "./flags";
import { clackPrompter, plainPrompter, Cancelled, type Prompter } from "./prompts";
import { plainBannerLine } from "./banner";
import { COMPONENTS, CORE_PACKAGES, DEFAULT_COMPONENTS, FRAMEWORKS, MIN_NODE, isComponentId, withRequirements, type ComponentId } from "./registry";

export interface InitDeps {
  cwd: string;
  env: Record<string, string | undefined>;
  stdinTTY: boolean;
  stdoutTTY: boolean;
  write: (s: string) => void;
  prompter: Prompter | null;
  apply: ApplyDeps;
  startDev: (root: string) => Promise<number>;
  /** Runs `concile migrate` on a Convex project at `root`. */
  migrate: (root: string) => Promise<number>;
  nodeVersion?: string;
}

function defaults(): InitDeps {
  return {
    cwd: process.cwd(),
    env: process.env,
    stdinTTY: Boolean(process.stdin.isTTY),
    stdoutTTY: Boolean(process.stdout.isTTY),
    write: (s) => process.stdout.write(s),
    prompter: null,
    apply: defaultApplyDeps(),
    startDev: async (root) => {
      process.chdir(root);
      // Dynamic import: cli.ts imports this file.
      const { devCommand } = await import("../cli");
      return devCommand([]);
    },
    migrate: async (root) => {
      // Dynamic import keeps init/* free of a static cycle through cli.ts.
      const { migrateCommand } = await import("../migrate");
      return migrateCommand(["--dir", join(root, "convex")]);
    },
  };
}

const COMPONENT_LIST = COMPONENTS.map((c) => c.id).join(", ");

export const INIT_HELP = `Usage: npx concile init [folder] [options]

Sets up Concile in the current folder (or creates <folder>). Safe to re-run.

  --yes                       accept the recommended setup, no questions
  --starter vite|next|none    starter for an empty folder (default vite)
  --components a,b            ${COMPONENT_LIST}
  --db sqlite|postgres        database (default sqlite)
  --database-url <url>        Postgres connection string
  --pm npm|pnpm|yarn|bun      package manager (default: detected)
  --no-install                skip installing packages
  --dry-run                   show the plan, change nothing
  --json                      machine-readable output (non-interactive)
`;

function describeFound(info: ProjectInfo): string {
  const fw = FRAMEWORKS.find((f) => f.id === info.framework)?.label;
  const parts = [info.kind === "empty" ? "Empty folder" : info.kind === "concile" ? "Concile project" : fw ?? "Project"];
  if (info.typescript) parts.push("TypeScript");
  parts.push(info.packageManager);
  return parts.join(" · ");
}

/** `functionsDir` from concile.config, relative to `root`. Falls back to reading the text when the config cannot load yet. */
async function configuredFunctionsDir(root: string): Promise<string> {
  const path = ["concile.config.ts", "concile.config.js"].map((f) => join(root, f)).find((p) => existsSync(p));
  if (!path) return "concile";
  let dir: string | undefined;
  try {
    dir = (await loadConfig(root)).functionsDir;
  } catch {
    // The config can import packages that are not installed yet.
    try { dir = /functionsDir\s*:\s*["'`]([^"'`]+)["'`]/.exec(readFileSync(path, "utf8"))?.[1]; } catch { dir = undefined; }
  }
  if (!dir) return "concile";
  const rel = (isAbsolute(dir) ? relative(root, dir) : dir).replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return rel || "concile";
}

/** detect(), plus the functions directory a project's concile.config sets. */
async function detectProject(root: string, env: Record<string, string | undefined>, nodeVersion: string): Promise<ProjectInfo> {
  const first = detect(root, env, nodeVersion);
  if (!first.hasConfig) return first;
  const dir = await configuredFunctionsDir(root);
  return dir === first.functionsDir ? first : detect(root, env, nodeVersion, dir);
}

const RUN_DEV: Record<PackageManager, string> = { npm: "npm run dev", pnpm: "pnpm dev", yarn: "yarn dev", bun: "bun run dev" };
const STARTER_PORT = { vite: 5173, next: 3001 } as const;
const NEXT_PORT_NOTE = "concile dev uses port 3000. Run Next on another port, e.g. next dev -p 3001.";

function installHint(pm: PackageManager, packages: string[]): string {
  const verb = pm === "npm" ? "install" : "add";
  return `Packages were not installed. Install them, then run: npx concile codegen\n  ${pm} ${verb} ${packages.join(" ")}`;
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function initCommand(args: string[], partial: Partial<InitDeps> = {}): Promise<number> {
  return runInit(args, { ...defaults(), ...partial }, false);
}

async function runInit(args: string[], d: InitDeps, nested: boolean): Promise<number> {
  let flags: InitFlags;
  try {
    flags = parseInitFlags(args);
  } catch (e) {
    d.write(`${formatError(e)}\n\n${INIT_HELP}`);
    return 1;
  }
  if (flags.help) {
    d.write(INIT_HELP);
    return 0;
  }

  const interactive = isInteractive(flags, d.env, d.stdinTTY, d.stdoutTTY);
  const ui: Prompter = d.prompter ?? (interactive ? clackPrompter(CLI_VERSION) : plainPrompter(d.write));
  /** Stops the run. In --json mode the message goes out as JSON so agents can parse it. */
  const stop = (msg: string, extra: Record<string, unknown> = {}): number => {
    if (flags.json) d.write(JSON.stringify({ ok: false, error: msg.trim(), ...extra }));
    else d.write(msg.endsWith("\n") ? msg : `${msg}\n`);
    return 1;
  };

  if (!flags.json && !nested) {
    if (interactive) await ui.intro();
    else {
      d.write(`${plainBannerLine(CLI_VERSION)}\n`);
      // Invisible to humans, read by agents (concealed SGR 8, the sv pattern).
      if (isAgent(d.env)) d.write("\x1b[8mAgents: run `npx concile init --help` for one-shot flags.\x1b[28m\n");
    }
  }

  // Preflight before anything else, including creating the folder.
  const nodeVersion = d.nodeVersion ?? process.versions.node;
  if (compareVersions(nodeVersion, MIN_NODE) < 0) {
    return stop(`Concile needs Node ${MIN_NODE} or newer. You have ${nodeVersion}. Update Node (https://nodejs.org) and run this again.`);
  }

  const root = resolve(d.cwd, flags.folder ?? ".");
  // detect() treats a folder that does not exist yet as empty. The folder is created only at apply time,
  // so Ctrl+C, --dry-run or an early stop leave nothing behind.
  let info = await detectProject(root, d.env, nodeVersion);
  // Lockfiles win over the user agent in detect(), so an explicit --pm is applied here.
  if (flags.pm) info = { ...info, packageManager: flags.pm };

  if (info.kind === "loose") {
    return stop("This folder has files but no package.json, so it doesn't look like a project.\nTo start a new app, run:  npx concile init my-app");
  }
  if (info.kind === "convex") {
    if (!interactive) return stop("This looks like a Convex project. Move it to Concile with:  npx concile migrate");
    let run: boolean;
    try {
      run = await ui.askMigrate();
    } catch (e) {
      if (e instanceof Cancelled) return 0;
      throw e;
    }
    if (run) return d.migrate(root);
    ui.outro("Nothing was changed. When you are ready, run:  npx concile migrate");
    return 0;
  }
  if (info.kind === "monorepo") {
    if (interactive && info.workspaceApps.length) {
      let app: string;
      try {
        app = await ui.askApp(info.workspaceApps);
      } catch (e) {
        if (e instanceof Cancelled) return 0;
        throw e;
      }
      const target = relative(d.cwd, resolve(root, app)) || ".";
      const rest = flags.folder === null ? args : args.filter((a) => a !== flags.folder);
      return runInit([target, ...rest], { ...d, prompter: ui }, true);
    }
    const lines = info.workspaceApps.map((a) => `  npx concile init ${relative(d.cwd, resolve(root, a)) || "."}`);
    return stop(`This is a monorepo. Run init inside the app you want to set up:\n${lines.join("\n")}`, { apps: info.workspaceApps });
  }
  if (!flags.json) ui.info(`Found  ${describeFound(info)}`);
  if (info.gitDirty && !flags.json) ui.warn("You have uncommitted changes. Concile only adds files, but a clean commit makes it easy to review.");

  let answers: Answers;
  try {
    answers = await decideAnswers(info, flags, interactive, ui);
  } catch (e) {
    if (e instanceof Cancelled) return 0;
    throw e;
  }
  // Non-interactive runs only add components. Removing is a choice made at the interactive checklist.
  if (!interactive && !flags.json && info.kind === "concile" && flags.components && info.existingComponents.some((c) => !flags.components!.includes(c))) {
    ui.info("To remove components, run npx concile init in a terminal and untick them.");
  }

  let actions: Action[] = planInit(info, answers, fsView(root));
  /** Set when --no-install leaves the generated code's packages missing: codegen cannot run yet. */
  let notInstalled: string | null = null;
  if (!flags.install) {
    const install = actions.find((a) => a.kind === "install");
    actions = actions.filter((a) => a.kind !== "install");
    if (CORE_PACKAGES.some((p) => !info.installedPackages.includes(p))) {
      // Codegen loads concile.config.ts and the functions, which import these packages.
      actions = actions.filter((a) => a.kind !== "codegen");
      notInstalled = installHint(info.packageManager, install && install.kind === "install" ? install.packages : [...CORE_PACKAGES]);
    } else if (actions.length === 1 && actions[0]!.kind === "codegen" && fsView(root).exists(`${info.functionsDir}/_generated/api.d.ts`)) {
      // planInit regenerates types whenever an install is pending. With --no-install that install is dropped,
      // so an otherwise settled project must not be reported as changed just for codegen.
      actions = [];
    }
  }

  if (flags.json && flags.dryRun) {
    d.write(JSON.stringify({ dryRun: true, root, found: info.kind, answers: redactAnswers(answers), actions: redactActions(actions) }, null, 2));
    return 0;
  }
  if (actions.length === 0) {
    if (flags.json) d.write(JSON.stringify({ ok: true, alreadySetUp: true, root, components: info.existingComponents, ...(notInstalled ? { next: notInstalled } : {}) }));
    else {
      if (notInstalled) ui.warn(notInstalled);
      ui.outro(`Already set up. Components: ${info.existingComponents.join(", ") || "none"}. Add more with: npx concile add <name>`);
    }
    return 0;
  }

  const lines = previewLines(actions, info).map((l) => `${l.mark} ${l.path.padEnd(28)} ${l.note}`.trimEnd());
  if (flags.dryRun) {
    d.write(`${lines.join("\n")}\nDry run: nothing was changed.\n`);
    return 0;
  }
  if (interactive) {
    let ok: boolean;
    try {
      ok = await ui.confirmApply(lines);
    } catch (e) {
      if (e instanceof Cancelled) return 0;
      throw e;
    }
    if (!ok) {
      ui.outro("Nothing was changed.");
      return 0;
    }
  } else if (!flags.json) d.write(`${lines.join("\n")}\n`);

  const installs = actions.some((a) => a.kind === "install");
  const generates = actions.some((a) => a.kind === "codegen");
  const label = installs ? `Installing with ${info.packageManager}${generates ? " and generating types" : ""}` : generates ? "Generating types" : "Writing files";
  const step = flags.json ? { done() {}, fail() {} } : ui.step(label);
  let result: ApplyResult;
  try {
    mkdirSync(root, { recursive: true });
    result = await applyPlan(root, info, actions, d.apply);
    step.done("Set up complete");
  } catch (e) {
    step.fail("Setup stopped");
    const done = e instanceof ApplyError ? e.done : [];
    const manual = e instanceof ApplyError ? e.manual : [];
    const msg = formatError(e);
    if (flags.json) {
      d.write(JSON.stringify({ ok: false, error: msg, done, manual, root }));
      return 1;
    }
    const parts: string[] = [];
    if (done.length) parts.push(`Done: ${done.join(", ")}`);
    if (manual.length) parts.push(`Still to do by hand:\n${manual.map((m) => `  ${m}`).join("\n")}`);
    parts.push(msg, "Files written so far are kept. Run the same command again to finish.");
    d.write(`${parts.join("\n")}\n`);
    return 1;
  }

  const fw = FRAMEWORKS.find((f) => f.id === (answers.starter && answers.starter !== "none" ? answers.starter : info.framework));
  const cd = flags.folder ? `cd ${flags.folder} && ` : "";
  if (flags.json) {
    d.write(JSON.stringify({ ok: true, root, answers: redactAnswers(answers), done: result.done, manual: result.manual, next: notInstalled ?? `${cd}npx concile dev` }));
    return 0;
  }
  for (const m of result.manual) ui.warn(m);
  const removed = actions.flatMap((a) => (a.kind === "config" ? a.remove : []));
  if (removed.length) {
    ui.info(
      `Removed from concile.config.ts: ${removed.join(", ")}. Their data stays in the database. To uninstall the packages: ${info.packageManager} remove ${removed.map((r) => `@concile/${r}`).join(" ")}`,
    );
  }
  if (!interactive) d.write(assumedLines(info, flags, answers) + `To repeat this: ${reproduceCommand(flags, answers)}\n`);
  if (info.kind !== "empty" && fw && fw.id !== "node") {
    const portNote = fw.id === "next" ? `\n${NEXT_PORT_NOTE}` : "";
    ui.info(`Connect your app (${fw.snippetFile}), using ${fw.envPrefix}CONCILE_URL from .env.local:\n${fw.snippet}${portNote}`);
  }
  if (notInstalled) {
    ui.outro(notInstalled);
    return 0;
  }
  const starter = actions.find((a) => a.kind === "copyTemplate");
  if (starter && starter.kind === "copyTemplate") {
    ui.info(`In another terminal: ${cd}${RUN_DEV[info.packageManager]}, then open http://localhost:${STARTER_PORT[starter.template]} in two tabs`);
  }
  if (interactive) {
    let start = false;
    try {
      start = await ui.askStartDev();
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
    if (start) return d.startDev(root);
  }
  ui.outro(`Next: ${cd}npx concile dev`);
  return 0;
}

const SECRET_ENV_KEYS = new Set(["CONCILE_DATABASE_URL"]);

/** JSON output is often logged by CI and agents: never echo a connection string. */
function redactAnswers(a: Answers): Answers {
  return a.databaseUrl ? { ...a, databaseUrl: "***" } : a;
}

function redactActions(actions: Action[]): Action[] {
  return actions.map((a) =>
    a.kind === "env" ? { ...a, keys: a.keys.map((k) => (SECRET_ENV_KEYS.has(k.key) && k.value ? { ...k, value: "***" } : k)) } : a,
  );
}

/** Every default the run assumed, each with the flag that changes it. */
function assumedLines(info: ProjectInfo, flags: InitFlags, a: Answers): string {
  const rows: string[] = [];
  const row = (name: string, value: string, flag: string, given: boolean) =>
    rows.push(`  ${`${name}:`.padEnd(13)} ${value.padEnd(24)} ${given ? "(from flag)" : `(change with ${flag})`}`);
  if (info.kind === "empty") row("starter", a.starter ?? "none", "--starter vite|next|none", flags.starter !== null);
  row("components", a.components.join(", ") || "none", "--components a,b", flags.components !== null);
  row("database", a.db, "--db sqlite|postgres", flags.db !== null || flags.databaseUrl !== null);
  row("pkg manager", info.packageManager, "--pm npm|pnpm|yarn|bun", flags.pm !== null);
  row("install", flags.install ? "yes" : "no", "--no-install", !flags.install);
  return `Assumed:\n${rows.map((r) => r.trimEnd()).join("\n")}\n`;
}

async function decideAnswers(info: ProjectInfo, flags: InitFlags, interactive: boolean, ui: Prompter): Promise<Answers> {
  // An existing Concile project keeps its components (none when it has no config file yet), and
  // --components only adds to them. Defaults apply only to a first setup.
  const current = info.kind === "concile" ? info.existingComponents : DEFAULT_COMPONENTS;
  const fromFlags = info.kind === "concile" ? [...current, ...(flags.components ?? [])] : flags.components ?? current;
  const base: Answers = {
    starter: info.kind === "empty" ? flags.starter ?? "vite" : null,
    components: withRequirements(fromFlags),
    db: flags.db ?? (flags.databaseUrl ? "postgres" : "sqlite"),
    databaseUrl: flags.databaseUrl,
  };
  if (!interactive) return base;
  if (info.kind === "concile") return { ...base, components: withRequirements(await ui.askComponents(info.existingComponents)) };
  const summary = `SQLite · ${current.join(", ")} · sample query`;
  if (await ui.askRecommended(summary)) return base;
  const starter = info.kind === "empty" ? await ui.askStarter() : null;
  const components = withRequirements(await ui.askComponents(current));
  const { db, url } = await ui.askDb();
  return { starter, components, db, databaseUrl: url };
}

const ADD_USAGE = `Usage: npx concile add <${COMPONENTS.map((c) => c.id).join("|")}> [--pm npm|pnpm|yarn|bun]\n`;

export async function addCommand(args: string[], partial: Partial<InitDeps> = {}): Promise<number> {
  const d = { ...defaults(), ...partial };
  const ids: string[] = [];
  let pm: PackageManager | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--help" || a === "-h") {
      d.write(ADD_USAGE);
      return 0;
    }
    if (a === "--pm") {
      const v = args[++i];
      if (v !== "npm" && v !== "pnpm" && v !== "yarn" && v !== "bun") {
        d.write(`--pm must be npm, pnpm, yarn or bun\n${ADD_USAGE}`);
        return 1;
      }
      pm = v;
    } else if (a.startsWith("-")) {
      d.write(`unknown option: ${a}\n${ADD_USAGE}`);
      return 1;
    } else ids.push(a);
  }
  const bad = ids.filter((a) => !isComponentId(a));
  if (ids.length === 0 || bad.length) {
    d.write(`${bad.length ? `unknown component: ${bad.join(", ")}\n` : ""}${ADD_USAGE}`);
    return 1;
  }
  const nodeVersion = d.nodeVersion ?? process.versions.node;
  if (compareVersions(nodeVersion, MIN_NODE) < 0) {
    d.write(`Concile needs Node ${MIN_NODE} or newer. You have ${nodeVersion}. Update Node (https://nodejs.org) and run this again.\n`);
    return 1;
  }
  let info = await detectProject(d.cwd, d.env, nodeVersion);
  if (pm) info = { ...info, packageManager: pm };
  if (info.kind !== "concile") {
    d.write("This folder isn't a Concile project yet. Run:  npx concile init\n");
    return 1;
  }
  const components = withRequirements([...info.existingComponents, ...(ids as ComponentId[])]);
  const actions = planInit(info, { starter: null, components, db: "sqlite", databaseUrl: null }, fsView(d.cwd));
  if (actions.length === 0) {
    d.write("Already added.\n");
    return 0;
  }
  let res: ApplyResult;
  try {
    res = await applyPlan(d.cwd, info, actions, d.apply);
  } catch (e) {
    const done = e instanceof ApplyError ? e.done : [];
    const manual = e instanceof ApplyError ? e.manual : [];
    if (done.length) d.write(`Done: ${done.join(", ")}\n`);
    for (const m of manual) d.write(`${m}\n`);
    d.write(`${formatError(e)}\nFiles written so far are kept. Run the same command again to finish.\n`);
    return 1;
  }
  for (const m of res.manual) d.write(`${m}\n`);
  d.write(`Done: ${res.done.join(", ")}\nAdded: ${ids.join(", ")}\n`);
  return 0;
}
