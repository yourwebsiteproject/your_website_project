#!/usr/bin/env bash
# ============================================================
#  build.sh — one-command session wrapper
#
#  Usage:
#    ./automation/build.sh start <day>   — start OBS recording
#    ./automation/build.sh stop          — stop recording + timelapse
#    ./automation/build.sh render <day>  — render Remotion video
#    ./automation/build.sh full <day>    — stop + timelapse + render
#
#  Typical daily flow:
#    ./automation/build.sh start 42
#    ... code for 1-2 hours ...
#    ./automation/build.sh full 42
# ============================================================

set -euo pipefail
SCRIPT_DIR="$(dirname "$0")"

CMD="${1:-}"
DAY="${2:-}"

case "$CMD" in
  start)
    bash "$SCRIPT_DIR/record.sh" start "$DAY"
    ;;

  stop)
    bash "$SCRIPT_DIR/record.sh" stop
    ;;

  timelapse)
    bash "$SCRIPT_DIR/timelapse.sh" "$DAY"
    ;;

  render)
    ts-node "$SCRIPT_DIR/render.ts" "$DAY"
    ;;

  full)
    # Stop recording → generate timelapse → render video
    bash "$SCRIPT_DIR/record.sh" stop
    DAY_FROM_TMP=$(grep 'day=' /tmp/obs_current_day 2>/dev/null | cut -d= -f2 || echo "$DAY")
    DAY_PAD=$(printf "%03d" "${DAY_FROM_TMP:-$DAY}")
    bash "$SCRIPT_DIR/timelapse.sh" "$((10#$DAY_PAD))"
    echo ""
    echo "✅ Build session complete for Day $DAY_PAD."
    echo "   Next: record a demo screen capture and run:"
    echo "   ts-node automation/render.ts $((10#$DAY_PAD))"
    ;;

  *)
    echo "Usage: $0 {start <day>|stop|timelapse <day>|render <day>|full <day>}"
    exit 1
    ;;
esac
