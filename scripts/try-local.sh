#!/usr/bin/env bash
# Try `concile init` from this checkout, exactly as a user would, without publishing anything.
#
# Builds the workspace, packs every publishable package the way the release does (`bun pm pack`),
# then runs this checkout's `concile init` in the current folder. CONCILE_LOCAL_PACKAGES makes
# init install those packed files instead of the npm versions, so `concile dev` and the starters
# afterwards run your local code too.
#
# Usage (from the folder you want to test in):
#   /path/to/concile/scripts/try-local.sh [init args]       e.g.  ... try-local.sh my-app
#   SKIP_BUILD=1 ...try-local.sh                            reuse the last build and tarballs
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${TMPDIR:-/tmp}/concile-local"
PACKS="$OUT/tarballs"
MANIFEST="$OUT/manifest.json"

if [ -z "${SKIP_BUILD:-}" ] || [ ! -f "$MANIFEST" ]; then
  echo "Building the workspace (log: $OUT/build.log)..."
  mkdir -p "$OUT"
  (cd "$REPO" && bun run build) >"$OUT/build.log" 2>&1 || { echo "Build failed. See $OUT/build.log"; exit 1; }

  echo "Packing packages..."
  rm -rf "$PACKS" && mkdir -p "$PACKS"
  while IFS= read -r dir; do
    (cd "$REPO/$dir" && bun pm pack --destination "$PACKS" --quiet >/dev/null)
  done < <(cd "$REPO" && node -e 'import("./scripts/list-publishable.mjs").then(m => { for (const p of m.publishablePackages()) console.log(p.dir) })')

  # name -> tarball path, read from each tarball's own package.json.
  node - "$PACKS" >"$MANIFEST" <<'EOF'
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");
const dir = process.argv[2];
const out = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".tgz"))) {
  const path = join(dir, f);
  out[JSON.parse(execFileSync("tar", ["-xOzf", path, "package/package.json"], { encoding: "utf8" })).name] = path;
}
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
EOF
  echo "Packed $(ls "$PACKS"/*.tgz | wc -l | tr -d ' ') packages."
fi

CONCILE_LOCAL_PACKAGES="$MANIFEST" exec node "$REPO/packages/cli/dist/bin.js" init "$@"
