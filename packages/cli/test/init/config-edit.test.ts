import { describe, it, expect } from "vitest";
import { renderConfig, editConfig, ConfigEditError, manualConfigSteps } from "../../src/init/config-edit";

describe("renderConfig", () => {
  it("imports defineConfig and each component's define call", () => {
    const src = renderConfig(["auth", "scheduler"]);
    expect(src).toContain('import { defineConfig } from "@concile/component";');
    expect(src).toContain('import { defineAuth } from "@concile/auth";');
    expect(src).toContain("components: [defineAuth(), defineScheduler()]");
  });
  it("no components", () => expect(renderConfig([])).toContain("components: []"));
});

describe("editConfig", () => {
  const existing = `// my config
import { defineConfig } from "@concile/component";
import { defineAuth } from "@concile/auth";

export default defineConfig({
  // keep this comment
  components: [defineAuth({ accessTtlMs: 1000 })],
});
`;
  it("adds a component and its import, keeping comments and existing args", () => {
    const out = editConfig(existing, ["scheduler"], []);
    expect(out).toContain("// keep this comment");
    expect(out).toContain("defineAuth({ accessTtlMs: 1000 })");
    expect(out).toMatch(/import \{ defineScheduler \} from ["']@concile\/scheduler["']/);
    expect(out).toContain("defineScheduler()");
  });
  it("removes a component written as a call", () => {
    const out = editConfig(existing, [], ["auth"]);
    expect(out).not.toContain("defineAuth(");
  });
  it("removing a component drops its now-unused import, keeps the rest and the comments", () => {
    const src = `// my config
import { defineConfig } from "@concile/component";
import { defineAuth } from "@concile/auth";
import { defineNotifications, consoleEmail } from "@concile/notifications";
import { defineScheduler } from "@concile/scheduler";

export default defineConfig({
  // keep this comment
  components: [defineAuth(), defineNotifications({ channels: { email: { provider: consoleEmail(), from: "x", templates: {} } } }), defineScheduler()],
});
`;
    const out = editConfig(src, [], ["auth", "notifications"]);
    expect(out).not.toContain("@concile/auth");
    expect(out).not.toContain("@concile/notifications");
    expect(out).toMatch(/import \{ defineScheduler \} from ["']@concile\/scheduler["']/);
    expect(out).toMatch(/import \{ defineConfig \} from ["']@concile\/component["']/);
    expect(out).toContain("// my config");
    expect(out).toContain("// keep this comment");
  });
  it("keeps an import that is still used elsewhere after removal", () => {
    const src = `import { defineConfig } from "@concile/component";
import { defineNotifications, consoleEmail } from "@concile/notifications";
const email = consoleEmail();
export default defineConfig({ components: [defineNotifications({ channels: { email: { provider: email, from: "x", templates: {} } } })] });
`;
    const out = editConfig(src, [], ["notifications"]);
    expect(out).not.toContain("defineNotifications");
    expect(out).toMatch(/import \{ consoleEmail \} from ["']@concile\/notifications["']/);
  });
  it("adding works when entries are identifiers", () => {
    const ids = `import { defineConfig } from "@concile/component";\nimport { auth } from "@concile/auth";\nexport default defineConfig({ components: [auth] });\n`;
    expect(editConfig(ids, ["scheduler"], [])).toContain("defineScheduler()");
  });
  it("refuses to remove an identifier entry (manual steps instead)", () => {
    const ids = `import { defineConfig } from "@concile/component";\nimport { auth } from "@concile/auth";\nexport default defineConfig({ components: [auth] });\n`;
    expect(() => editConfig(ids, [], ["auth"])).toThrow(ConfigEditError);
    expect(manualConfigSteps([], ["auth"]).join("\n")).toContain("@concile/auth");
  });
  it("refuses configs it cannot understand", () => {
    expect(() => editConfig("export default makeIt();\n", ["auth"], [])).toThrow(ConfigEditError);
  });
  it("uses the local alias of an aliased import and does not duplicate", () => {
    const src = `import { defineConfig } from "@concile/component";\nimport { defineScheduler as sch } from "@concile/scheduler";\nexport default defineConfig({ components: [sch()] });\n`;
    const out = editConfig(src, ["scheduler"], []);
    expect(out.match(/sch\(\)/g)).toHaveLength(1);
    expect(out).not.toContain("defineScheduler(");
    const src2 = `import { defineConfig } from "@concile/component";\nimport { defineScheduler as sch } from "@concile/scheduler";\nexport default defineConfig({ components: [] });\n`;
    const out2 = editConfig(src2, ["scheduler"], []);
    expect(out2).toContain("sch()");
    expect(out2).not.toContain("defineScheduler(");
    expect(editConfig(src, [], ["scheduler"])).not.toContain("sch()");
  });
  it("is idempotent when adding an existing component", () => {
    const once = editConfig(existing, ["scheduler"], []);
    expect(editConfig(once, ["scheduler"], [])).toBe(once);
    expect(editConfig(existing, ["auth"], [])).toBe(editConfig(existing, [], []));
  });
  it("refuses a non-array components value", () => {
    const src = `import { defineConfig } from "@concile/component";\nconst list = [];\nexport default defineConfig({ components: list });\n`;
    expect(() => editConfig(src, ["auth"], [])).toThrow(ConfigEditError);
    expect(() => editConfig(src, [], ["auth"])).toThrow(ConfigEditError);
  });
});
