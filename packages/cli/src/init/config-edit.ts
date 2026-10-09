import { parseModule, generateCode, builders } from "magicast";
import { componentById, type ComponentId } from "./registry";

export class ConfigEditError extends Error {}

export function renderConfig(ids: ComponentId[]): string {
  const imports = ids.map((id) => {
    const c = componentById(id);
    return `import { ${c.imports.join(", ")} } from "${c.pkg}";`;
  });
  const exprs = ids.map((id) => componentById(id).expr);
  return [
    'import { defineConfig } from "@concile/component";',
    ...imports,
    "",
    "// Components add features to your backend. Add more with `npx concile add <name>`.",
    `export default defineConfig({ components: [${exprs.join(", ")}] });`,
    "",
  ].join("\n");
}

export function manualConfigSteps(add: ComponentId[], remove: ComponentId[]): string[] {
  const steps: string[] = [];
  for (const id of add) {
    const c = componentById(id);
    steps.push(`Add to concile.config.ts: import { ${c.imports.join(", ")} } from "${c.pkg}";`);
    steps.push(`and put ${c.expr} in the components array.`);
  }
  for (const id of remove) steps.push(`Remove the ${componentById(id).pkg} entry from the components array in concile.config.ts.`);
  return steps;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Proxy = any;

/** Every identifier name in the program outside import declarations (a conservative "is it used"). */
function identifiersOutsideImports(ast: Proxy): Set<string> {
  const names = new Set<string>();
  const walk = (node: Proxy): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "ImportDeclaration") return;
    if (node.type === "Identifier" && typeof node.name === "string") names.add(node.name);
    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "start" || key === "end" || key === "comments" || key === "leadingComments" || key === "trailingComments" || key === "tokens") continue;
      walk(node[key]);
    }
  };
  walk(ast);
  return names;
}

export function editConfig(source: string, add: ComponentId[], remove: ComponentId[]): string {
  let mod: Proxy;
  try { mod = parseModule(source); } catch (e) { throw new ConfigEditError(`could not parse concile.config: ${(e as Error).message}`); }
  const def: Proxy = mod.exports.default;
  if (!def || def.$type !== "function-call" || def.$callee !== "defineConfig") throw new ConfigEditError("default export is not defineConfig({...})");
  const opts: Proxy = def.$args[0];
  if (!opts || typeof opts !== "object") throw new ConfigEditError("defineConfig has no options object");
  if (!opts.components) opts.components = [];
  const arr: Proxy = opts.components;
  if (arr.$type !== "array" || typeof arr.length !== "number") throw new ConfigEditError("`components` is not an array literal");

  /** Local names bound to `name` imported from `pkg` (handles `import { a as b }`). */
  const localsOf = (pkg: string, name: string): string[] =>
    Object.values(mod.imports).filter((imp: Proxy) => imp.from === pkg && imp.imported === name).map((imp: Proxy) => imp.local as string);

  for (const id of remove) {
    const c = componentById(id);
    const callees = new Set<string>([...c.imports, ...c.imports.flatMap((n) => localsOf(c.pkg, n))]);
    let removed = false;
    for (let i = arr.length - 1; i >= 0; i--) {
      const el = arr[i];
      if (el && el.$type === "function-call" && callees.has(el.$callee)) { arr.splice(i, 1); removed = true; }
    }
    if (!removed) throw new ConfigEditError(`cannot find a ${c.imports[0]}(...) entry to remove`);
  }

  // Drop imports the removal left unused, so uninstalling the package afterwards cannot break the config.
  if (remove.length) {
    const used = identifiersOutsideImports(mod.$ast);
    for (const id of remove) {
      const c = componentById(id);
      for (const imp of Object.values(mod.imports) as Proxy[]) {
        if (imp.from === c.pkg && !used.has(imp.local)) delete mod.imports[imp.local];
      }
    }
  }

  for (const id of add) {
    const c = componentById(id);
    const defineLocals = new Set<string>([c.imports[0]!, ...localsOf(c.pkg, c.imports[0]!)]);
    let present = false;
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el && el.$type === "function-call" && defineLocals.has(el.$callee)) { present = true; break; }
    }
    if (present) continue;
    let expr = c.expr;
    for (const name of c.imports) {
      const locals = localsOf(c.pkg, name);
      if (locals.length === 0) mod.imports.$append({ from: c.pkg, imported: name, local: name });
      else if (!locals.includes(name)) expr = expr.replace(new RegExp(`\\b${name}\\b`, "g"), locals[0]!);
    }
    arr.push(builders.raw(expr));
  }
  return generateCode(mod).code;
}
