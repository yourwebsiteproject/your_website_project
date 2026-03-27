#!/usr/bin/env bash
# ============================================================
#  record.sh — OBS recording control via obs-websocket
#
#  Usage:
#    ./automation/record.sh start <day_number>
#    ./automation/record.sh stop
#
#  Requirements:
#    - OBS installed with obs-websocket plugin enabled
#    - obs-cmd installed: https://github.com/grigio/obs-cmd
#      (brew install obs-cmd  OR  cargo install obs-cmd)
#    - Set OBS_WS_URL and OBS_WS_PASSWORD env vars
# ============================================================

set -euo pipefail

OBS_URL="${OBS_WS_URL:-ws://localhost:4455}"
OBS_PASS="${OBS_WS_PASSWORD:-}"
RECORDINGS_DIR="$(dirname "$0")/../video/recordings"
mkdir -p "$RECORDINGS_DIR"

CMD="${1:-}"
DAY="${2:-}"

case "$CMD" in
  start)
    if [ -z "$DAY" ]; then
      echo "Usage: $0 start <day_number>"
      exit 1
    fi
    DAY_PAD=$(printf "%03d" "$DAY")
    echo "🎬 Starting OBS recording for Day $DAY_PAD..."

    # Set output filename before starting
    obs-cmd --websocket "$OBS_URL" --password "$OBS_PASS" \
      recording set-directory "$(realpath "$RECORDINGS_DIR")" 2>/dev/null || true

    obs-cmd --websocket "$OBS_URL" --password "$OBS_PASS" recording start
    echo "day=$DAY_PAD" > /tmp/obs_current_day
    echo "✅ Recording started. File will save to $RECORDINGS_DIR/"
    echo "   Run './automation/record.sh stop' when done."
    ;;

  stop)
    if [ ! -f /tmp/obs_current_day ]; then
      echo "⚠️  No active recording session found."
      exit 1
    fi
    DAY_PAD=$(grep 'day=' /tmp/obs_current_day | cut -d= -f2)

    echo "⏹️  Stopping OBS recording..."
    obs-cmd --websocket "$OBS_URL" --password "$OBS_PASS" recording stop
    sleep 2
    rm -f /tmp/obs_current_day

    # Find the most recently created .mkv or .mp4 in recordings dir
    RAW_FILE=$(ls -t "$RECORDINGS_DIR"/*.{mkv,mp4} 2>/dev/null | head -n1 || true)
    if [ -z "$RAW_FILE" ]; then
      echo "⚠️  Could not find raw recording file."
      exit 1
    fi

    TARGET="$RECORDINGS_DIR/day${DAY_PAD}_raw.mp4"
    if [ "$RAW_FILE" != "$TARGET" ]; then
      mv "$RAW_FILE" "$TARGET"
    fi

    echo "✅ Saved: $TARGET"
    echo "   Run './automation/timelapse.sh $DAY_PAD' to generate the time-lapse."
    ;;

  *)
    echo "Usage: $0 {start <day>|stop}"
    exit 1
    ;;
esac
