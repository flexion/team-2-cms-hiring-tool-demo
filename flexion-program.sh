#!/usr/bin/env bash
#
# flexion-program.sh — Shim that forwards to the flexion-oea-coder watcher.
#
# Scaffolded by /program on first run. This file is a thin forwarder; the
# real watcher lives in the plugin at skills/program/tools/program.sh.
# Keeping it a forwarder means the project does not accumulate a stale
# copy of the watcher when the plugin updates.
#
# Usage:
#   ./flexion-program.sh                      # watches the current directory
#   ./flexion-program.sh [watcher args...]    # forwards args (e.g. -y, --plugin-dir)
#
# Plugin location resolution order:
#   1. $FLEXION_OEA_CODER_PLUGIN_DIR  (explicit override)
#   2. $HOME/.claude/plugins/marketplaces/*/flexion-oea-coder
#   3. $HOME/.claude/plugins/*/flexion-oea-coder
#
# If none succeed, set FLEXION_OEA_CODER_PLUGIN_DIR or install the plugin.
#
# Exit codes (mirrors skills/program/tools/program.sh — this shim execs into
# program.sh, so its exit codes are program.sh's exit codes):
#   0   done-success sentinel observed
#   1   done-error sentinel observed (or this shim could not locate the plugin)
#   2   idle timeout exceeded (no process-log activity for IDLE_TIMEOUT_SECS)
#   3   claude exited without writing any sentinel
#   4   halt-for-user sentinel observed (user must resolve _program_workspace/halt-for-user.md before relaunching)
#   130 SIGINT/SIGTERM received

set -euo pipefail

find_plugin_dir() {
  if [[ -n "${FLEXION_OEA_CODER_PLUGIN_DIR:-}" ]]; then
    if [[ -f "$FLEXION_OEA_CODER_PLUGIN_DIR/skills/program/tools/program.sh" ]]; then
      printf '%s\n' "$FLEXION_OEA_CODER_PLUGIN_DIR"
      return 0
    fi
    echo "flexion-program.sh: FLEXION_OEA_CODER_PLUGIN_DIR is set to '$FLEXION_OEA_CODER_PLUGIN_DIR' but does not contain skills/program/tools/program.sh" >&2
    return 1
  fi
  local candidate
  for candidate in \
    "$HOME/.claude/plugins/marketplaces"/*/flexion-oea-coder \
    "$HOME/.claude/plugins"/*/flexion-oea-coder; do
    if [[ -d "$candidate" && -f "$candidate/skills/program/tools/program.sh" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

if ! PLUGIN_DIR="$(find_plugin_dir)"; then
  cat >&2 <<'EOF'
flexion-program.sh: could not locate the flexion-oea-coder plugin.

Either:
  1. Install the plugin:   claude plugins install flexion-oea-coder
  2. Set an explicit path: export FLEXION_OEA_CODER_PLUGIN_DIR=/path/to/plugin

The plugin root is the directory containing skills/program/tools/program.sh.
EOF
  exit 1
fi

# Default the project directory to the current working directory when no args.
if [[ $# -eq 0 ]]; then
  set -- "$(pwd)"
fi

exec bash "$PLUGIN_DIR/skills/program/tools/program.sh" "$@"
