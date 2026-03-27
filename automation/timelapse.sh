#!/usr/bin/env bash
# ============================================================
#  timelapse.sh — convert raw OBS recording into a time-lapse
#
#  Usage:
#    ./automation/timelapse.sh <day_number>
#
#  Produces:
#    video/recordings/dayXXX_timelapse.mp4  (20x speed, no audio)
#
#  Requirements: ffmpeg
# ============================================================

set -euo pipefail

DAY="${1:-}"
if [ -z "$DAY" ]; then
  echo "Usage: $0 <day_number>"
  exit 1
fi

DAY_PAD=$(printf "%03d" "$DAY")
RECORDINGS_DIR="$(dirname "$0")/../video/recordings"

INPUT="$RECORDINGS_DIR/day${DAY_PAD}_raw.mp4"
OUTPUT="$RECORDINGS_DIR/day${DAY_PAD}_timelapse.mp4"

if [ ! -f "$INPUT" ]; then
  echo "❌ Raw recording not found: $INPUT"
  exit 1
fi

echo "⚡ Generating time-lapse for Day $DAY_PAD..."
echo "   Input:  $INPUT"
echo "   Output: $OUTPUT"
echo "   Speed:  20x (setpts=0.05*PTS)"

ffmpeg -y -i "$INPUT" \
  -vf "setpts=0.05*PTS" \
  -an \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -movflags +faststart \
  "$OUTPUT"

echo ""
echo "✅ Time-lapse saved: $OUTPUT"
echo "   Duration: $(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT" | xargs printf "%.1f")s"
