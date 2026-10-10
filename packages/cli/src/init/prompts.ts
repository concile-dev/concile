import * as p from "@clack/prompts";
import { COMPONENTS, type ComponentId, type StarterId } from "./registry";
import { detectColorLevel, supportsUnicode } from "../ui";
import { plainBannerLine, showBanner } from "./banner";

export interface Prompter {
  intro(): Promise<void>;
  askApp(apps: string[]): Promise<string>;
  askRecommended(summary: string): Promise<boolean>;
  askStarter(): Promise<StarterId>;
  askComponents(current: ComponentId[]): Promise<ComponentId[]>;
  askDb(): Promise<{ db: "sqlite" | "postgres"; url: string | null }>;
  confirmApply(lines: string[]): Promise<boolean>;
  askStartDev(): Promise<boolean>;
  askMigrate(): Promise<boolean>;
  /** A folder with files but no package.json: set up a project inside it, or create a new app folder. */
  askLoose(projects: string[], suggested: string, taken: (name: string) => boolean): Promise<string>;
  info(msg: string): void;
  warn(msg: string): void;
  step(msg: string): { done(msg: string): void; fail(msg: string): void };
  outro(msg: string): void;
}

/** Thrown when the user presses Ctrl+C at a question. Nothing has been written at that point. */
export class Cancelled extends Error {
  constructor() {
    super("cancelled");
    this.name = "Cancelled";
  }
}

function check<T>(v: T, cancelMessage = "Nothing was changed."): Exclude<T, symbol> {
  if (p.isCancel(v)) {
    p.cancel(cancelMessage);
    throw new Cancelled();
  }
  return v as Exclude<T, symbol>;
}

/** The terminal clackPrompter draws on. Injectable so the banner choice can be tested. */
export interface PrompterTerm {
  env: Record<string, string | undefined>;
  isTTY: boolean;
  platform: string;
  columns: number;
  write: (s: string) => void;
}

export function clackPrompter(
  version: string,
  io: PrompterTerm = {
    env: process.env,
    isTTY: Boolean(process.stdout.isTTY),
    platform: process.platform,
    columns: process.stdout.columns ?? 80,
    write: (s) => process.stdout.write(s),
  },
): Prompter {
  const term = { env: io.env, isTTY: io.isTTY, platform: io.platform };
  const level = detectColorLevel(term, { honorForce: true });
  const dim = (s: string) => (level === 0 ? s : `\x1b[2m${s}\x1b[22m`);
  return {
    async intro() {
      // No colour (NO_COLOR, TERM=dumb): one plain line instead of the logo (spec section 4, Banner).
      if (level === 0) {
        io.write(`${plainBannerLine(version)}\n`);
        return;
      }
      await showBanner({ columns: io.columns, level, unicode: supportsUnicode(term), version }, io.write, true);
    },
    async askApp(apps) {
      return check(await p.select({ message: "This is a monorepo. Which app should get Concile?", options: apps.map((a) => ({ value: a, label: a })) }));
    },
    async askRecommended(summary) {
      return check(
        await p.select<boolean>({
          message: "Set up Concile with the recommended setup?",
          options: [
            { value: true, label: "Yes", hint: summary },
            { value: false, label: "Customize" },
          ],
        }),
      );
    },
    async askStarter() {
      return check(
        await p.select<StarterId>({
          message: "Pick a starter",
          options: [
            { value: "vite", label: "React + Vite", hint: "recommended" },
            { value: "next", label: "Next.js" },
            { value: "none", label: "Backend only" },
          ],
        }),
      );
    },
    async askComponents(current) {
      return check(
        await p.multiselect<ComponentId>({
          message: `Pick components\n${dim("Change anytime: npx concile add <name>, or edit concile.config.ts.")}`,
          options: COMPONENTS.map((c) => ({ value: c.id, label: c.label, hint: c.hint })),
          initialValues: current,
          required: false,
        }),
      );
    },
    async askDb() {
      const db = check(
        await p.select<"sqlite" | "postgres">({
          message: "Database",
          options: [
            { value: "sqlite", label: "SQLite", hint: "no setup" },
            { value: "postgres", label: "Postgres" },
          ],
        }),
      );
      if (db === "sqlite") return { db, url: null };
      const url = check(await p.text({ message: "Postgres URL (leave empty to add it later)", placeholder: "postgres://user:pass@host:5432/db" }));
      return { db, url: url?.trim() ? url.trim() : null };
    },
    async confirmApply(lines) {
      p.note(lines.join("\n"), "Here's what will change");
      return check(await p.confirm({ message: "Apply?", initialValue: true }));
    },
    async askStartDev() {
      // Setup has already run here, so a Ctrl+C must not claim nothing changed.
      return check(await p.confirm({ message: "Start the dev server now?", initialValue: true }), "Setup is done. Start later with: npx concile dev");
    },
    async askMigrate() {
      return check(await p.confirm({ message: "This looks like a Convex project. Run `concile migrate` now?", initialValue: true }));
    },
    async askLoose(projects, suggested, taken) {
      const NEW = "\0new";
      if (projects.length) {
        const pick = check(
          await p.select({
            message: "This folder is not a project. What should get Concile?",
            options: [...projects.map((d) => ({ value: d, label: `${d}/`, hint: "existing project" })), { value: NEW, label: "A new app in a new folder" }],
          }),
        );
        if (pick !== NEW) return pick;
      }
      return check(
        await p.text({
          message: "Name the new app folder",
          initialValue: suggested,
          validate: (v) => {
            const name = (v ?? "").trim();
            if (!name) return "Type a folder name.";
            if (/[\\/]/.test(name)) return "Use a plain folder name, without slashes.";
            if (taken(name)) return `${name} already exists. Pick another name.`;
            return undefined;
          },
        }),
      ).trim();
    },
    info: (m) => p.log.info(m),
    warn: (m) => p.log.warn(m),
    step(msg) {
      const s = p.spinner();
      s.start(msg);
      // clack v1: spinner.stop() takes no exit code; failures use spinner.error().
      return { done: (m) => s.stop(m), fail: (m) => s.error(m) };
    },
    outro: (m) => p.outro(m),
  };
}

/** Non-interactive: never reads stdin. Questions are never called in this mode (answers come from flags). */
export function plainPrompter(write: (s: string) => void): Prompter {
  const never = (): never => {
    throw new Error("plainPrompter cannot ask questions");
  };
  return {
    async intro() {},
    askApp: never,
    askRecommended: never,
    askStarter: never,
    askComponents: never,
    askDb: never,
    askStartDev: never,
    askMigrate: never,
    askLoose: never,
    async confirmApply() {
      return true;
    },
    info: (m) => write(`${m}\n`),
    warn: (m) => write(`warning: ${m}\n`),
    step: (m) => {
      write(`${m}\n`);
      return { done: (d) => write(`  ok: ${d}\n`), fail: (d) => write(`  failed: ${d}\n`) };
    },
    outro: (m) => write(`${m}\n`),
  };
}
