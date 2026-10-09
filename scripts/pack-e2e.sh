#!/usr/bin/env bash
# Pack-based end-to-end test (spec section 9.2): the packages exactly as npm would ship them.
#
# Builds the workspace, packs every publishable package the way scripts/release.mjs does
# (`bun pm pack`, which rewrites workspace:* ranges), installs all the tarballs into a fresh
# project with REAL npm, runs the packed `concile init`, then starts `concile dev` and waits for
# /api/health. If pnpm is available it repeats the run with pnpm in a second project.
# Third-party dependencies download from the registry. Not part of `bun run test`.
#
# Usage: scripts/pack-e2e.sh            (SKIP_BUILD=1 reuses existing dist/ folders)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$(dirname "$(command -v node)")"
NPM="$NODE_BIN/npm" # plain `npm` may be an alias for bun on dev machines
WORK="$(mktemp -d)"
TARBALLS="$WORK/tarballs"
mkdir -p "$TARBALLS"
export npm_config_cache="$WORK/npm-cache"
DEV_PGID=""
RESULTS=()

stop_dev() {
  if [ -n "$DEV_PGID" ]; then
    kill -TERM -- "-$DEV_PGID" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$DEV_PGID" 2>/dev/null || true
    DEV_PGID=""
  fi
}
cleanup() {
  stop_dev
  if [ -z "${KEEP_WORK:-}" ]; then rm -rf "$WORK"; else echo "kept $WORK"; fi
}
trap cleanup EXIT

echo "node $(node -v) · npm $("$NPM" -v) · $WORK"

# 1. Build.
if [ -z "${SKIP_BUILD:-}" ]; then
  (cd "$REPO" && bun run build)
fi

# 2. Pack every publishable package (same list and same packer as the release).
while IFS= read -r dir; do
  (cd "$REPO/$dir" && bun pm pack --destination "$TARBALLS" --quiet >/dev/null)
done < <(cd "$REPO" && node -e 'import("./scripts/list-publishable.mjs").then(m => { for (const p of m.publishablePackages()) console.log(p.dir) })')
COUNT="$(ls "$TARBALLS"/*.tgz | wc -l | tr -d ' ')"
echo "packed $COUNT packages"

# A package.json that depends on every tarball. The same map goes into overrides, so a dependency
# between two of our packages also resolves to the local tarball, never the registry.
write_project() {
  local dir="$1" pm="$2"
  mkdir -p "$dir"
  node - "$TARBALLS" "$pm" > "$dir/package.json" <<'EOF'
const { readdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");
const [dir, pm] = process.argv.slice(2);
const deps = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".tgz"))) {
  const path = join(dir, f);
  const name = JSON.parse(execFileSync("tar", ["-xOzf", path, "package/package.json"], { encoding: "utf8" })).name;
  deps[name] = `file:${path}`;
}
const pkg = { name: "pack-e2e-app", private: true, type: "module", dependencies: deps };
if (pm === "pnpm") pkg.pnpm = { overrides: deps };
else pkg.overrides = deps;
process.stdout.write(JSON.stringify(pkg, null, 2) + "\n");
EOF
}

# 3. Install, init, dev, health. Returns non-zero on failure.
run_with() {
  local pm="$1" dir="$WORK/app-$1"
  echo "--- $pm: $dir"
  write_project "$dir" "$pm"
  cd "$dir"
  if [ "$pm" = npm ]; then
    "$NPM" install --no-audit --no-fund --loglevel=error >install.log 2>&1 || { echo "FAIL ($pm): install"; tail -40 install.log; return 1; }
  else
    pnpm install --reporter=append-only >install.log 2>&1 || { echo "FAIL ($pm): install"; tail -40 install.log; return 1; }
  fi
  CI=1 ./node_modules/.bin/concile init --yes --starter none >init.log 2>&1 || { echo "FAIL ($pm): concile init"; cat init.log; return 1; }
  cat init.log
  [ -f concile/_generated/api.d.ts ] || { echo "FAIL ($pm): init did not generate types"; return 1; }

  # Own process group (set -m) so the whole tree can be killed; a 60s watchdog replaces `timeout`.
  set -m
  CI=1 ./node_modules/.bin/concile dev --no-ui >dev.log 2>&1 &
  DEV_PGID=$!
  set +m
  ( sleep 60; kill -TERM -- "-$DEV_PGID" 2>/dev/null || true ) >/dev/null 2>&1 &

  local up=0
  for _ in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then up=1; break; fi
    sleep 1
  done
  stop_dev
  [ "$up" = 1 ] || { echo "FAIL ($pm): dev did not answer /api/health"; cat dev.log; return 1; }
  echo "PASS ($pm): install + init + dev from packed tarballs"
  cd "$WORK"
}

STATUS=0
if run_with npm; then RESULTS+=("npm PASS"); else RESULTS+=("npm FAIL"); STATUS=1; fi
cd "$WORK"
if command -v pnpm >/dev/null 2>&1; then
  if run_with pnpm; then RESULTS+=("pnpm PASS"); else RESULTS+=("pnpm FAIL"); STATUS=1; fi
else
  RESULTS+=("pnpm SKIPPED (not installed)")
fi
cd "$WORK"
printf '%s\n' "${RESULTS[@]}"
exit "$STATUS"
