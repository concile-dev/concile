# syntax=docker/dockerfile:1.7
# Concile Tier 0 — single-container self-host. Follows the official Turborepo Docker
# pattern (prune → cached install → build → slim non-root runner), Bun-native.
# Ref: https://github.com/vercel/turborepo/tree/main/examples/with-docker

ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

# ---- prepare: prune the workspace to @concile/cli (the server/engine) + its deps ----
# `turbo prune --docker` splits the result into:
#   out/json  — manifests + bun.lock  → a dependency-install layer cached until manifests change
#   out/full  — source                → the build layer
# The dashboard SPA is pulled in because @concile/cli depends on @concile/dashboard.
FROM base AS prepare
COPY . .
RUN bunx turbo prune @concile/cli --docker

# ---- builder: install only the pruned deps (cached unless manifests change), then build ----
FROM base AS builder
COPY --from=prepare /app/out/json/ .
# --ignore-scripts: the only trustedDependencies postinstalls (better-sqlite3, embedded-postgres)
# are host-test-only substrates; the shipped runtime uses bun:sqlite. Compiling better-sqlite3
# would need a C++ toolchain the slim image deliberately lacks.
RUN bun install --frozen-lockfile --ignore-scripts
COPY --from=prepare /app/out/full/ .
# `turbo prune` does not copy root-level shared config files; every package's tsconfig does
# `"extends": "../../tsconfig.base.json"`, so the DTS build needs it present at the root.
COPY tsconfig.base.json ./tsconfig.base.json
RUN bun run build

# ---- runner: slim, non-root (the oven/bun image ships a `bun` user, uid 1000) ----
FROM base AS runner
ENV NODE_ENV=production \
    CONCILE_DATA_DIR=/data
COPY --from=builder --chown=bun:bun /app .
# Link workspace @concile/* packages into the ROOT node_modules so a BIND-MOUNTED app can
# resolve them. turbo-prune + bun keep workspace links nested per-package
# (/app/packages/cli/node_modules/@concile/*), never at /app/node_modules — but a mounted
# /app/concile is not under any package, so its bare `import "@concile/values"` (every schema.ts)
# and the `_generated/server` re-exports walk up to /app/node_modules and fail without these links.
RUN <<'EOF'
bun -e '
  const fs = require("fs");
  fs.mkdirSync("node_modules/@concile", { recursive: true });
  for (const base of ["packages", "components"]) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base)) {
      const pj = base + "/" + d + "/package.json";
      if (!fs.existsSync(pj)) continue;
      const name = JSON.parse(fs.readFileSync(pj, "utf8")).name;
      if (!name || !name.startsWith("@concile/")) continue;
      try { fs.symlinkSync("/app/" + base + "/" + d, "node_modules/" + name); } catch {}
    }
  }
'
EOF
# Create /data (SQLite volume) and /app/.concile-deploy (the `concile deploy` scratch tree),
# both owned by the non-root `bun` user, BEFORE dropping privileges. Two distinct EACCES traps:
#   - A fresh named /data volume inherits this dir's ownership; without the chown, uid-1000 `bun`
#     can't create /data/db.sqlite (crash-loop on first `docker compose up`).
#   - `/app`'s DIR NODE is still root-owned (the COPY above chowned only its CONTENTS), so `bun`
#     can't create /app/.concile-deploy when `concile deploy` writes the pushed tree there.
# chown needs root, so this must run before `USER bun`.
RUN mkdir -p /data /app/.concile-deploy && chown bun:bun /data /app /app/.concile-deploy
USER bun
# Embedded SQLite database lives on a single mounted volume.
VOLUME ["/data"]
EXPOSE 3000
# Production entrypoint: serve the app mounted at /app/concile, SQLite on the /data volume.
ENTRYPOINT ["bun", "packages/cli/dist/bin.js"]
CMD ["serve", "--dir", "/app/concile", "--data", "/data/db.sqlite"]
