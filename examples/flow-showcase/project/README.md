# Flow showcase · editing project

Rebuilds `output/Flow_Showcase_Michael.mp4` from the live Figma prototype and Michael's ten WAVs.

| File | Role |
|---|---|
| `transcribe.sh` | Word timings (whisper.cpp word segments and DTW), then `cues.py` and `window_check.py` |
| `cues.py` → `cues.json` | Three estimates per cue phrase (Whisper, DTW, energy onset) and the chosen master time |
| `window_check.py` → `onsets.json` | Fourth check for critical cues: when the word stops being heard in clipped windows |
| `showcase.config.mjs` | The shot plan: 11 takes, each tap and glide timed on the master timeline |
| `assemble.py` → `edl.json` | Cuts each take at its T0 marker and lays the original WAVs over it, in one ffmpeg pass |
| `verify.py` → `../qa/` | The three QA passes on the exported MP4 |
| `report.py` → `../sync_audit.md` | Event-level synchronization audit |
| `narration/` | 16 kHz copies and transcripts (word-level and DTW) |

## Rebuild

```sh
# From the repo root. Needs Node 20+, Chrome, ffmpeg, whisper-cpp (brew) and ~/.cache/whisper-cpp/ggml-base.en.bin.
# The narration WAVs (micheal_*.wav) are not in the repo: pass the folder that holds them.
sh examples/flow-showcase/project/transcribe.sh ~/Downloads     # only if the narration changes
node src/cli.js record examples/flow-showcase/project/showcase.config.mjs --out examples/flow-showcase/takes  # ~13 min
cd examples/flow-showcase/project
python3 assemble.py ../takes ~/Downloads
python3 verify.py ../takes ~/Downloads && python3 report.py
```

To move a tap, change its time in `showcase.config.mjs` (or give a take a `slip`), then re-record and reassemble.
