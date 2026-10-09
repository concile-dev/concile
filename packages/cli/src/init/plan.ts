import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { packageNameFor, type ProjectInfo } from "./detect";
import { AGENTS_BLOCK, CORE_PACKAGES, FRAMEWORKS, SAMPLE_MESSAGES, SAMPLE_SCHEMA, SYNC_URL, componentById, withRequirements, type ComponentId, type StarterId } from "./registry";
import { envHasKey, gitignoreCovers, gitignoreNegates, hasBlock } from "./text-edit";
import { renderConfig } from "./config-edit";

export interface Answers { starter: StarterId | null; components: ComponentId[]; db: "sqlite" | "postgres"; databaseUrl: string | null }
export type Action =
  | { kind: "copyTemplate"; template: "vite" | "next"; name: string }
  | { kind: "writeFile"; path: string; content: string; note: string }
  | { kind: "config"; add: ComponentId[]; remove: ComponentId[] }
  | { kind: "env"; keys: { key: string; value: string; comment?: string }[] }
  | { kind: "gitignore"; entries: string[] }
  | { kind: "agents"; files: string[] }
  | { kind: "install"; packages: string[]; full: boolean }
  | { kind: "codegen" };
export interface FsView {
  read(rel: string): string | null;
  exists(rel: string): boolean;
  /** Resolved real path, or null when unknown. Optional so virtual views in tests can skip it. */
  real?(rel: string): string | null;
}

export function fsView(root: string): FsView {
  return {
    read: (rel) => { try { return readFileSync(join(root, rel), "utf8"); } catch { return null; } },
    exists: (rel) => existsSync(join(root, rel)),
    real: (rel) => { try { return realpathSync(join(root, rel)); } catch { return null; } },
  };
}

const STARTER_FRAMEWORK = { vite: "vite", next: "next" } as const;

export function planInit(info: ProjectInfo, a: Answers, fs: FsView): Action[] {
  if (info.kind === "convex" || info.kind === "monorepo" || info.kind === "loose") return [];
  const acts: Action[] = [];
  const components = withRequirements(a.components);
  const usingStarter = info.kind === "empty" && (a.starter === "vite" || a.starter === "next");
  const frameworkId = usingStarter ? STARTER_FRAMEWORK[a.starter as "vite" | "next"] : info.framework ?? "node";
  const prefix = FRAMEWORKS.find((f) => f.id === frameworkId)?.envPrefix ?? "";

  const name = packageNameFor(info.root.split(/[\\/]/).pop() ?? "");
  if (usingStarter) acts.push({ kind: "copyTemplate", template: a.starter as "vite" | "next", name });
  else if (info.kind === "empty") acts.push({ kind: "writeFile", path: "package.json", content: JSON.stringify({ name, private: true, type: "module" }, null, 2) + "\n", note: "" });

  // Samples go only into a project that has neither a functions directory nor a config yet. An existing
  // Concile project keeps exactly the functions it has.
  const dir = info.functionsDir;
  if (!fs.exists(dir) && !info.hasConfig) {
    acts.push({ kind: "writeFile", path: `${dir}/schema.ts`, content: SAMPLE_SCHEMA, note: "sample table" });
    acts.push({ kind: "writeFile", path: `${dir}/messages.ts`, content: SAMPLE_MESSAGES, note: "sample query + mutation" });
  }

  if (!fs.exists("concile.config.ts") && !fs.exists("concile.config.js")) {
    acts.push({ kind: "writeFile", path: "concile.config.ts", content: renderConfig(components), note: `components: [${components.join(", ")}]` });
  } else {
    const add = components.filter((c) => !info.existingComponents.includes(c));
    const remove = info.existingComponents.filter((c) => !components.includes(c));
    if (add.length || remove.length) acts.push({ kind: "config", add, remove });
  }

  const envText = fs.read(".env.local") ?? "";
  const keys: { key: string; value: string; comment?: string }[] = [];
  if (!envHasKey(envText, `${prefix}CONCILE_URL`)) keys.push({ key: `${prefix}CONCILE_URL`, value: SYNC_URL });
  if (a.db === "postgres" && !envHasKey(envText, "CONCILE_DATABASE_URL")) keys.push({ key: "CONCILE_DATABASE_URL", value: a.databaseUrl ?? "", comment: "Postgres connection string (leave empty to use SQLite)" });
  for (const id of components) for (const k of componentById(id).envKeys) if (!envHasKey(envText, k.key)) keys.push({ key: k.key, value: "", comment: k.comment });
  if (keys.length) acts.push({ kind: "env", keys });

  const gi = fs.read(".gitignore") ?? "";
  // Skip entries the user re-included with "!": mergeGitignore will not add them, so planning them would never settle.
  const entries = [".concile/", ".env.local"].filter((e) => !gitignoreCovers(gi, e) && !gitignoreNegates(gi, e));
  if (entries.length) acts.push({ kind: "gitignore", entries });

  // Files that resolve to the same real file (CLAUDE.md -> AGENTS.md) are written once, via the first name.
  const seen = new Set<string>();
  const agentFiles = ["AGENTS.md", ...(fs.exists("CLAUDE.md") ? ["CLAUDE.md"] : [])]
    .filter((f) => { const r = fs.real?.(f) ?? f; if (seen.has(r)) return false; seen.add(r); return true; })
    .filter((f) => !hasBlock(fs.read(f) ?? "", AGENTS_BLOCK));
  if (agentFiles.length) acts.push({ kind: "agents", files: agentFiles });

  const wanted = [...CORE_PACKAGES, ...components.map((c) => componentById(c).pkg)];
  const packages = wanted.filter((p) => !info.installedPackages.includes(p));
  if (packages.length || usingStarter) acts.push({ kind: "install", packages, full: usingStarter });

  const changesCode = acts.some((x) => x.kind === "writeFile" || x.kind === "config" || x.kind === "install" || x.kind === "copyTemplate");
  if (changesCode || !fs.exists(`${dir}/_generated/api.d.ts`)) acts.push({ kind: "codegen" });
  return acts;
}

export function previewLines(actions: Action[], info: ProjectInfo, fs: FsView = fsView(info.root)): { mark: "+" | "~"; path: string; note: string }[] {
  const out: { mark: "+" | "~"; path: string; note: string }[] = [];
  const mark = (p: string): "+" | "~" => (fs.exists(p) ? "~" : "+");
  for (const a of actions) {
    if (a.kind === "copyTemplate") out.push({ mark: "+", path: `${a.template === "vite" ? "React + Vite" : "Next.js"} starter`, note: "live chat demo" });
    else if (a.kind === "writeFile") out.push({ mark: mark(a.path), path: a.path, note: a.note });
    else if (a.kind === "config") out.push({ mark: "~", path: "concile.config.ts", note: [...a.add.map((c) => `+ ${c}`), ...a.remove.map((c) => `- ${c}`)].join(" ") });
    else if (a.kind === "env") out.push({ mark: mark(".env.local"), path: ".env.local", note: a.keys.map((k) => `+ ${k.key}`).join(" ") });
    else if (a.kind === "gitignore") out.push({ mark: mark(".gitignore"), path: ".gitignore", note: a.entries.map((e) => `+ ${e}`).join(" ") });
    else if (a.kind === "agents") for (const f of a.files) out.push({ mark: mark(f), path: f, note: "so AI coding tools know Concile" });
    else if (a.kind === "install") out.push({ mark: "~", path: "package.json", note: a.packages.length ? `+ ${a.packages.join(", ")}` : "install dependencies" });
  }
  return out;
}
