# Example: a narration-timed product showcase (Flow)

The Flow showcase, rebuilt from the live Figma prototype, with every tap timed to a voice-over. Michael's ten narration
WAVs are the master timeline.

- [`project/`](project/README.md): the reproducible editing project. It has the cue timing (`cues.py`, `window_check.py`),
  the shot plan (`showcase.config.mjs`), assembly (`assemble.py`), QA (`verify.py`), the audit report (`report.py`) and a
  runtime-state probe (`probe.mjs`).
- [`sync_audit.md`](sync_audit.md): event-level audit of the exported video. Each row is cursor → tap → screen response →
  narration cue.
- [`edit_report.md`](edit_report.md): what was built, how it was checked, and remaining notes.
- `qa/qa.json`: raw QA measurements.

Not in the repo: audio files (the narration WAVs, by request), and videos and images (`takes/`, `output/`, QA frames),
under the repo-wide rules in `.gitignore`. Rebuild them with the steps in `project/README.md`.
