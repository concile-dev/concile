#!/usr/bin/env bash
# Release gate: the stranger's path on the PUBLISHED package, with real npm and an empty cache.
# Usage: scripts/clean-machine-test.sh [version]   (default: latest)
set -euo pipefail
VERSION="${1:-latest}"
NODE_BIN="$(dirname "$(command -v node)")"
NPX="$NODE_BIN/npx"
NPM="$NODE_BIN/npm"
WORK="$(mktemp -d)"
export npm_config_cache="$(mktemp -d)"
DEV_PGID=""
cleanup() {
  # Kill the whole dev process group (npx -> node server), on PASS and FAIL alike.
  if [ -n "$DEV_PGID" ]; then
    kill -TERM -- "-$DEV_PGID" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$DEV_PGID" 2>/dev/null || true
  fi
}
trap cleanup EXIT
cd "$WORK"
echo "node $(node -v) · npm $("$NPM" -v) · $WORK"

# 1. The main path: npx concile init, then dev.
CI=1 "$NPX" -y "concile@$VERSION" init my-app --yes --starter vite

# 2. The alias path: npm create concile.
mkdir alias-parent && (cd alias-parent && CI=1 "$NPM" create "concile@$VERSION" alias-app -- --yes --starter none --no-install)
# --no-install skips codegen (nothing is installed), so only the written files are checked.
[ -f alias-parent/alias-app/concile/schema.ts ] || { echo "FAIL: create-concile alias did not scaffold concile/schema.ts"; exit 1; }
[ -f alias-parent/alias-app/concile.config.ts ] || { echo "FAIL: create-concile alias did not write concile.config.ts"; exit 1; }
echo "alias ok"

cd my-app
# Own process group (set -m) so the whole tree can be killed. `timeout` is GNU coreutils and
# absent on stock macOS, so a 60s watchdog in the same group replaces it.
set -m
CI=1 "$NPX" concile dev --no-ui > dev.log 2>&1 &
DEV_PGID=$!
set +m
( sleep 60; kill -TERM -- "-$DEV_PGID" 2>/dev/null || true ) >/dev/null 2>&1 &

# Ready means the server answers, not that the address appears in a log line.
UP=0
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then UP=1; break; fi
  sleep 1
done
[ "$UP" = 1 ] || { echo "FAIL: dev did not answer /api/health"; cat dev.log; exit 1; }
echo "PASS: init + alias + dev on a clean machine ($VERSION)"
