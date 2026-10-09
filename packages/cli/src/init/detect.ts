import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { COMPONENTS, FRAMEWORKS, MIN_NODE, type ComponentId, type FrameworkId } from "./registry";

export type ProjectKind = "empty" | "frontend" | "node" | "convex" | "concile" | "monorepo" | "loose";
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export interface ProjectInfo {
  root: string;
  kind: ProjectKind;
  framework: FrameworkId | null;
  packageManager: PackageManager;
  typescript: boolean;
  gitDirty: boolean | null;
  nodeVersion: string;
  nodeOk: boolean;
  existingComponents: ComponentId[];
  workspaceApps: string[];
  hasFunctionsDir: boolean;
  hasConfig: boolean;
  installedPackages: string[];
  /** The functions directory, relative to `root`. "concile" unless concile.config sets `functionsDir`. */
  functionsDir: string;
}

const IGNORED = new Set([".git", ".DS_Store", "Thumbs.db", ".idea", ".vscode", ".gitignore", ".gitattributes"]);
/** A fresh GitHub clone has these. They do not make a folder "not empty": starters never overwrite them. */
const IGNORED_PREFIXES = [/^readme/i, /^license/i, /^licence/i];
const ignoredEntry = (e: string) => IGNORED.has(e) || IGNORED_PREFIXES.some((re) => re.test(e));

/** A valid npm package name from a folder name: "My App" -> "my-app". */
export function packageNameFor(folder: string): string {
  const name = folder
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/-+$/, "")
    .slice(0, 214);
  return name || "my-app";
}

export function compareVersions(a: string, b: string): number {
  const norm = (v: string) => v.replace(/^v/, "").split(/[-+]/)[0]!.split(".").map(Number);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

function readJson(path: string): Record<string, unknown> | null {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

const LOCKFILES = ["pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "package-lock.json"];

/**
 * The folder whose lockfile and packageManager field decide the package manager. In a monorepo app
 * (apps/web) those live at the workspace root, so search upward from `root` to the nearest folder with
 * a lockfile, a pnpm-workspace.yaml, or a package.json with "workspaces" or "packageManager".
 * The search stops at a folder holding .git (the repo root) or at the filesystem root.
 */
export function packageManagerRoot(root: string): string {
  let dir = root;
  for (;;) {
    if (LOCKFILES.some((f) => existsSync(join(dir, f))) || existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const pj = readJson(join(dir, "package.json"));
    if (pj && (pj.workspaces !== undefined || typeof pj.packageManager === "string")) return dir;
    const parent = dirname(dir);
    if (existsSync(join(dir, ".git")) || parent === dir) return root;
    dir = parent;
  }
}

function packageManager(start: string, env: Record<string, string | undefined>): PackageManager {
  const root = packageManagerRoot(start);
  // Lockfile first: `npx` always sets the user agent to npm, so it cannot be trusted over the project.
  if (existsSync(join(root, "pnpm-lock.yaml")) || existsSync(join(root, "pnpm-workspace.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) return "bun";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  const field = readJson(join(root, "package.json"))?.packageManager;
  if (typeof field === "string") {
    for (const pm of ["pnpm", "yarn", "bun", "npm"] as const) if (field.startsWith(`${pm}@`) || field === pm) return pm;
  }
  const ua = env.npm_config_user_agent ?? "";
  for (const pm of ["pnpm", "yarn", "bun", "npm"] as const) if (ua.startsWith(pm)) return pm;
  return "npm";
}

function workspaceApps(root: string, pkgJson: Record<string, unknown> | null): string[] {
  let patterns: string[] = [];
  const ws = pkgJson?.workspaces;
  if (Array.isArray(ws)) patterns = ws as string[];
  else if (ws && typeof ws === "object" && Array.isArray((ws as { packages?: unknown }).packages)) patterns = (ws as { packages: string[] }).packages;
  const pnpmWs = join(root, "pnpm-workspace.yaml");
  if (existsSync(pnpmWs)) {
    for (const m of readFileSync(pnpmWs, "utf8").matchAll(/^\s*-\s*["']?([^"'\n]+)["']?\s*$/gm)) if (m[1]) patterns.push(m[1]);
  }
  const apps: string[] = [];
  for (const p of patterns) {
    if (!p.endsWith("/*")) { if (existsSync(join(root, p, "package.json"))) apps.push(p); continue; }
    const base = p.slice(0, -2);
    if (!existsSync(join(root, base))) continue;
    for (const d of readdirSync(join(root, base))) {
      if (existsSync(join(root, base, d, "package.json"))) apps.push(`${base}/${d}`);
    }
  }
  return apps;
}

function gitDirty(root: string): boolean | null {
  const r = spawnSync("git", ["status", "--porcelain", "--", "."], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    timeout: 5000,
  });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim().length > 0;
}

export function detect(
  root: string,
  env: Record<string, string | undefined> = process.env,
  nodeVersion: string = process.versions.node,
  functionsDir = "concile",
): ProjectInfo {
  const entries = existsSync(root) ? readdirSync(root).filter((e) => !ignoredEntry(e)) : [];
  const pkgJson = readJson(join(root, "package.json"));
  const deps = { ...(pkgJson?.dependencies as object), ...(pkgJson?.devDependencies as object) } as Record<string, string>;
  const installedPackages = Object.keys(deps);
  const hasFunctionsDir = existsSync(join(root, functionsDir)) && statSync(join(root, functionsDir)).isDirectory();
  const configPath = ["concile.config.ts", "concile.config.js"].map((f) => join(root, f)).find(existsSync);
  const configText = configPath ? readFileSync(configPath, "utf8") : "";
  const existingComponents = COMPONENTS.filter((c) => configText.includes(`"${c.pkg}"`) || configText.includes(`'${c.pkg}'`)).map((c) => c.id);
  const apps = workspaceApps(root, pkgJson);
  const framework = pkgJson ? (FRAMEWORKS.find((f) => f.deps.length === 0 || f.deps.some((d) => d in deps))?.id ?? "node") : null;

  let kind: ProjectKind;
  if (entries.length === 0) kind = "empty";
  else if (apps.length > 0) kind = "monorepo";
  else if (hasFunctionsDir || configPath || "concile" in deps || "@concile/cli" in deps) kind = "concile";
  else if (existsSync(join(root, "convex"))) kind = "convex";
  else if (!pkgJson) kind = "loose";
  else kind = framework === "node" ? "node" : "frontend";

  return {
    root,
    kind,
    framework: kind === "empty" || kind === "loose" ? null : framework,
    packageManager: packageManager(root, env),
    typescript: existsSync(join(root, "tsconfig.json")),
    gitDirty: entries.length === 0 ? null : gitDirty(root),
    nodeVersion,
    nodeOk: compareVersions(nodeVersion, MIN_NODE) >= 0,
    existingComponents,
    workspaceApps: apps,
    hasFunctionsDir,
    hasConfig: Boolean(configPath),
    installedPackages,
    functionsDir,
  };
}
