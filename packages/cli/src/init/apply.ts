import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Action } from "./plan";
import type { PackageManager, ProjectInfo } from "./detect";
import { hasBlock, mergeEnv, mergeGitignore, upsertBlock } from "./text-edit";
import { CLI_VERSION } from "../version";
import { AGENTS_BLOCK } from "./registry";
import { ConfigEditError, editConfig, manualConfigSteps } from "./config-edit";
import { ensureGeneratedStub } from "../generated-stub";
import { loadConfig } from "../load-config";

export interface ApplyDeps {
  install(pm: PackageManager, packages: string[], full: boolean, cwd: string): Promise<void>;
  codegen(functionsDir: string): Promise<void>;
  templatesDir: string;
}
export interface ApplyResult { done: string[]; manual: string[] }

/** Thrown when a step fails part-way. Carries what was already done so the caller can report it. */
export class ApplyError extends Error {
  constructor(message: string, readonly done: string[], readonly manual: string[], options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApplyError";
  }
}

function isDanglingLink(path: string): boolean {
  try { return lstatSync(path).isSymbolicLink() && !existsSync(path); } catch { return false; }
}

/** @internal exported for tests. */
export function writeAtomic(path: string, content: string): void {
  if (isDanglingLink(path)) {
    // Write through the link so it stays a link and its target gets created.
    writeFileSync(path, content);
    return;
  }
  // Write next to the real file, so a symlink (CLAUDE.md -> AGENTS.md, .env.local -> shared/env)
  // stays a symlink and its target gets the change.
  const target = existsSync(path) ? realpathSync(path) : path;
  mkdirSync(dirname(target), { recursive: true });
  const tmp = `${target}.concile-tmp`;
  // Keep the permissions of a file we merge into (a 0600 .env.local must stay 0600).
  const mode = existsSync(target) ? statSync(target).mode & 0o7777 : undefined;
  try {
    writeFileSync(tmp, content, mode === undefined ? undefined : { mode });
    if (mode !== undefined) chmodSync(tmp, mode); // writeFileSync's mode is masked by umask
    renameSync(tmp, target);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* temp file may not exist */ }
    throw e;
  }
}
const readOr = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

function copyTemplate(src: string, dest: string, name: string): void {
  // npm strips files named .gitignore from packages, so templates ship `_gitignore`.
  cpSync(src, dest, { recursive: true, force: false, errorOnExist: false });
  const gi = join(dest, "_gitignore");
  const real = join(dest, ".gitignore");
  if (existsSync(gi)) {
    if (!existsSync(real)) renameSync(gi, real);
    else {
      // A fresh clone already has a .gitignore: add the starter's lines to it, keep everything else.
      const lines = readFileSync(gi, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
      writeAtomic(real, mergeGitignore(readFileSync(real, "utf8"), lines));
      unlinkSync(gi);
    }
  }
  const pj = join(dest, "package.json");
  if (existsSync(pj)) {
    const json = JSON.parse(readFileSync(pj, "utf8"));
    json.name = name;
    writeAtomic(pj, JSON.stringify(json, null, 2) + "\n");
  }
}

export async function applyPlan(root: string, info: ProjectInfo, actions: Action[], deps: ApplyDeps): Promise<ApplyResult> {
  const done: string[] = [];
  const manual: string[] = [];
  const functionsDir = join(root, info.functionsDir);
  try {
    await runActions();
  } catch (e) {
    if (e instanceof ApplyError) throw e;
    throw new ApplyError(e instanceof Error ? e.message : String(e), done, manual, { cause: e });
  }
  return { done, manual };

  async function runActions(): Promise<void> {
    for (const a of actions) {
      switch (a.kind) {
        case "copyTemplate":
          copyTemplate(join(deps.templatesDir, a.template), root, a.name);
          done.push(`starter: ${a.template}`);
          break;
        case "writeFile": {
          const p = join(root, a.path);
          if (!existsSync(p)) { writeAtomic(p, a.content); done.push(a.path); }
          break;
        }
        case "config": {
          const p = existsSync(join(root, "concile.config.ts")) ? join(root, "concile.config.ts") : join(root, "concile.config.js");
          try { writeAtomic(p, editConfig(readFileSync(p, "utf8"), a.add, a.remove)); done.push("concile.config"); }
          catch (e) { if (e instanceof ConfigEditError) manual.push(...manualConfigSteps(a.add, a.remove)); else throw e; }
          break;
        }
        case "env":
          writeAtomic(join(root, ".env.local"), mergeEnv(readOr(join(root, ".env.local")), a.keys));
          done.push(".env.local");
          break;
        case "gitignore":
          writeAtomic(join(root, ".gitignore"), mergeGitignore(readOr(join(root, ".gitignore")), a.entries));
          done.push(".gitignore");
          break;
        case "agents":
          for (const f of a.files) {
            const next = upsertBlock(readOr(join(root, f)), AGENTS_BLOCK);
            // upsertBlock returns the text unchanged when the markers are malformed; leave the file alone.
            if (!hasBlock(next, AGENTS_BLOCK)) {
              manual.push(`${f} has a damaged concile marker block; fix or remove the <!-- concile:start/end --> lines and run init again.`);
              continue;
            }
            writeAtomic(join(root, f), next);
            done.push(f);
          }
          break;
        case "install":
          await deps.install(info.packageManager, a.packages, a.full, root);
          done.push("install");
          break;
        case "codegen": {
          const config = await loadConfig(root).catch(() => ({ components: [] }));
          ensureGeneratedStub(functionsDir, config.components);
          await deps.codegen(functionsDir);
          done.push("codegen");
          break;
        }
      }
    }
  }
}

const INSTALL_ARGS: Record<PackageManager, (pkgs: string[]) => string[]> = {
  npm: (p) => ["install", ...p],
  pnpm: (p) => (p.length ? ["add", ...p] : ["install"]),
  yarn: (p) => (p.length ? ["add", ...p] : ["install"]),
  bun: (p) => (p.length ? ["add", ...p] : ["install"]),
};

/**
 * Pins concile and every @concile/* package to this CLI's version, so `npx concile@0.3.0 init`
 * installs 0.3.x packages and not whatever is newest. A source checkout ("dev") pins nothing.
 */
export function pinPackages(packages: string[], version: string = CLI_VERSION): string[] {
  if (!/^\d+\.\d+\.\d+/.test(version)) return packages;
  return packages.map((p) => (p === "concile" || p.startsWith("@concile/") ? `${p}@^${version}` : p));
}

/**
 * The package-manager commands for one install step. One command only: `add <pkgs>` (or
 * `npm install <pkgs>`) also installs everything already in package.json, so a starter does not
 * need a separate full install first.
 */
export function installCommands(pm: PackageManager, packages: string[], full: boolean, version: string = CLI_VERSION): string[][] {
  if (packages.length) return [INSTALL_ARGS[pm](pinPackages(packages, version))];
  return full ? [INSTALL_ARGS[pm]([])] : [];
}

const TAIL = 2000;

/** @internal exported for tests. Both pipes are drained (a full pipe would hang the child); only a tail is kept. */
export function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out = (out + String(d)).slice(-TAIL); });
    child.stderr.on("data", (d) => { err = (err + String(d)).slice(-TAIL); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      const tail = [out.trim(), err.trim()].filter(Boolean).join("\n");
      reject(new Error(`${cmd} ${args.join(" ")} failed (exit ${code})${tail ? `\n${tail}` : ""}`));
    });
  });
}

export function defaultApplyDeps(): ApplyDeps {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/bin.js and dist/index.js sit in dist/; templates ship beside dist/.
  const templatesDir = [join(here, "..", "templates"), join(here, "..", "..", "templates")].find((d) => existsSync(d) && readdirSync(d).length > 0) ?? join(here, "..", "templates");
  return {
    templatesDir,
    async install(pm, packages, full, cwd) {
      for (const args of installCommands(pm, packages, full)) await runCommand(pm, args, cwd);
    },
    async codegen(functionsDir) {
      // Dynamic import: cli.ts imports init/command.ts, which imports this file.
      const { codegenCommand } = await import("../cli");
      const code = await codegenCommand(["--dir", functionsDir], { quiet: true });
      if (code !== 0) throw new Error("codegen failed");
    },
  };
}
