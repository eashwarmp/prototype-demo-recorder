#!/bin/sh
# Word timings for Michael's ten WAVs: 16 kHz copies, whisper.cpp word segments and DTW token times (CPU only;
# the Metal backend crashes on this Mac). Then cues.py and window_check.py build cues.json and onsets.json.
# Needs: brew install whisper-cpp ffmpeg, and ggml-base.en.bin in ~/.cache/whisper-cpp.
set -e
SRC=${1:-$HOME/Downloads}
HERE=$(cd "$(dirname "$0")" && pwd)
M=$HOME/.cache/whisper-cpp/ggml-base.en.bin
mkdir -p "$HERE/narration/dtw"
for s in intro request_to_plan permissions executions human_approval reciepts_proof change_the_plan bring_your_own_tools team_wfs product_close; do
  ffmpeg -hide_banner -loglevel error -y -i "$SRC/micheal_$s.wav" -ar 16000 -ac 1 "$HERE/narration/$s.wav"
  whisper-cli -m "$M" -f "$HERE/narration/$s.wav" -ml 1 -sow -oj -of "$HERE/narration/$s" -np -ng >/dev/null 2>&1
  whisper-cli -m "$M" -f "$HERE/narration/$s.wav" -ojf -of "$HERE/narration/dtw/$s" -np -ng -nfa -dtw base.en >/dev/null 2>&1
done
python3 -I "$HERE/cues.py"
python3 -I "$HERE/window_check.py"
