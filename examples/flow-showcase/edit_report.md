# Flow product showcase · edit report

**Deliverable:** `output/Flow_Showcase_Michael.mp4`. It's 3:22.97 long, 780×1688 (2× phone), 30 fps, H.264, with AAC audio at 48 kHz.
Event-level timings are in `sync_audit.md`, and QA evidence in `qa/`. Everything needed to rebuild it is in `project/`.

## What was built

A clean rebuild from the live Figma prototype, using the file "flow" with the updated logo. Every shot was re-recorded with each tap
scheduled against Michael's narration. No footage was reused from `Flow_Michael_Repair_Opening.mp4`, `Flow_Michael_Clean_Cut_No_Recovery.mp4`
or the `.mov` recordings. Their call, SMS and lock-screen shots still showed the old three-bar logo.

**Audio master.** Michael's ten original WAVs (from `~/Downloads`) run back to back, unaltered and at natural speed, in this order:

| # | Section | Starts | Length |
|---|---|---|---|
| 1 | Introducing Flow | 0:00.00 | 18.80 s |
| 2 | Request to Plan | 0:18.80 | 19.92 s |
| 3 | Tools and Permissions | 0:38.72 | 22.88 s |
| 4 | Execution | 1:01.60 | 20.48 s |
| 5 | Human Approval | 1:22.08 | 19.20 s |
| 6 | Receipts and Proof | 1:41.28 | 23.92 s |
| 7 | Change the Plan | 2:05.20 | 18.16 s |
| 8 | Bring Your Own Tools (MCP) | 2:23.36 | 23.04 s |
| 9 | Team Workflows | 2:46.40 | 21.28 s |
| 10 | Product Closing | 3:07.68 | 12.80 s (narration ends 3:20.48) |

The picture holds the branded Welcome screen (new logo) for 2.5 s after the last word.

**Excluded, as asked:**
- `micheal_reliability.wav` and the Gmail disconnect/recovery screens.
- The AI-generated character scenes.

**Shots.** There are 11 takes, each cut at a narration boundary:

| Take | Time | What's on screen |
|---|---|---|
| A | 0:00–0:47.6 | Home, then workflow choices, Qualify new leads, the request, the plan, Start, and HubSpot's permission sheet. One continuous take. |
| B | 0:47.6–0:54.9 | Connections cutaway: a Gmail action turned off, Sheets limited to three spreadsheets, Slack limited to #all-flow. |
| C | 0:54.9–2:05.1 | Back on the identical HubSpot sheet, then Connect, Start, call summary, transcript, approval, Approve, done, invoice History, the receipt, and undo. One continuous take. |
| D–F | 2:05.1–3:00.5 | Change the plan, billing tool via MCP, team. |
| G | 3:00.5–3:05.3 | Call, then SMS, then lock screen. Each cut lands on the words "calls", "texts" and "notifications". |
| H–I | 3:05.3–3:23.0 | Home, then the branded closing screen on "That's Flow". |

## How the timing was set and checked

1. **Cue times** come from three independent estimates per phrase: Whisper word starts, Whisper DTW token times, and audio energy onsets.
   They agreed within 0.3 s on most cues.
2. **Every critical cue was then verified by ear-equivalent clipping.** I transcribed short windows that start at different times and
   binary-searched for when the word stops being heard (`window_check.py`). This caught one real Whisper error: "transcript" starts at
   13.43 s into Execution, not 13.88 s.
3. **Recording.** Each tap is scheduled to land 0.2–0.5 s before the words that describe its result. Every glide and scroll is paced by
   the wall clock, so nothing drifts.
4. **Checks.** All three checks ran on the exported MP4, not the timeline. Response times come from the video's pixels. Narration
   placement comes from correlating each original WAV against the exported audio.

## Results

- **Sync:** all 24 critical interactions pass. Each result screen is visible between 0.61 s before and 0.27 s after the words that
  describe it. One screen is shown early on purpose: the HubSpot permission sheet appears as Michael opens the section and stays on
  screen until he describes it 3 s later.
- **Cuts:** all 10 land with or just before their narration (0.05–0.45 s lead).
- **Technical:**
  - Every narration section sits within 0.00 s of its slot.
  - No black frames.
  - The picture runs 2.5 s past the last word.
  - 780×1688 at 30 fps.
- **Visual pass:** I reviewed the whole MP4 at 1 frame per second, the 10 fps strips of every interaction and cut, and the montage frame by
  frame. The new logo appears on Home, the call screen, SMS, lock-screen notifications and the closing screen. No other workflow is
  opened, and there are no repeated intro screens, cropped transitions or backtracking.

## The reference's known problems, and how each is handled

| Problem | In this cut |
|---|---|
| A · Opening continuity | The opening is one continuous take: Home → workflow choices (hovered on "Chasing… Handling… Qualifying…") → Qualify new leads → request → plan. The only change of Home screen is the prototype's own navigation when the request is filled in. |
| B · Cursor ahead of narration | Every tap is scheduled against its words, and measured in `sync_audit.md`. |
| C · Approval sequence | Qualified lead → pending approval → the approval sheet visible on "But before it makes that change" (+0.22 s), held through "it asks" → Approve on "One tap" → completed result 0.54 s before "Flow continues". |
| D · Receipts introduction | There's no Connections screen. The run's completed result stays up for "how do you know…", then History opens on "Here's another example" and the invoice receipt on "invoice follow-up". |
| E · Closing integrity | Video and audio both run to 3:22.97, with the branded screen steady from "That's Flow" to the end. |

## Remaining notes (not hidden as passes)

- **Change the Plan take** is used 0.3 s earlier than recorded. Figma animates the change box in for about 0.4 s, and without the slip
  the box appeared 0.35 s after "Tell Flow…", just outside the 0.3 s tolerance. Its other cue (the updated plan) now leads by 0.61 s.
- **Section 8 opens on a different version of the "Chase late invoices" plan** than section 7 ended on. It's the billing example, with a
  late-fee step, and the cut lands on "And what if a workflow needs a tool you haven't connected?". This is a new example, not a jump
  back, but the plan title is the same.
- **Connect HubSpot** shows a one-frame (0.1 s) cross-dissolve from "Connect a CRM" to "HubSpot connected". That's the prototype's own
  transition.
- **The MCP sign-in** (Continue to sign in → Continue → Allow) moves at one tap every 0.7–0.8 s, so the three taps fit "including
  through an MCP integration". It's quick, but every screen is readable.
- **Cursor arrival** is taken from the schedule (the approach glide ends 0.15 s before each tap) and confirmed visually in
  `qa/interactions/`. The automated check measures taps and screen responses, not the cursor's pixel position.
- **Response times** are measured at 10 fps, so they're accurate to ±0.1 s.

## Recorder changes this needed (prototype-demo-recorder, uncommitted)

- Glides and scrolls are now paced by the wall clock. Before, each mouse step's own cost made a 0.7 s glide take up to 1.4 s, which
  pushed narration-timed taps up to 4.5 s late.
- `restart(seconds, url)` opens any frame. `click()` presses exactly where the cursor is.
- Unit tests pass.
