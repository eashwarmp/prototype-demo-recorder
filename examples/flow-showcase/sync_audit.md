# Flow showcase · synchronization audit

Measured on the exported file `Flow_Showcase_Michael.mp4` (202.97 s), not on the edit timeline.

For each interaction: the cursor glides onto the control (arriving 0.15 s before the tap), the tap, the first frame where the
screen visibly responds (measured from the video pixels at 10 fps, so ±0.1 s), and the start of the narration that describes
the result. **Visible − cue** is negative when the screen leads the words. Pass: from 0.8 s early to 0.3 s late (one
interaction, marked, is meant to sit on screen while Michael introduces the topic).

| # | Interaction | Cursor arrives | Tap | Screen responds | Narration cue (starts) | Visible − cue | Result |
|---|---|---|---|---|---|---|---|
| 1 | Qualify new leads — request filled in after "Let's try that last one" | 0:24.01 | 0:24.16 | 0:24.40 | 0:24.21 “try” (window-verified) | +0.19 s | PASS |
| 2 | Send — plan on "Flow lays out the work" | 0:30.77 | 0:30.92 | 0:31.10 | 0:31.36 “flow lays” (window-verified) | -0.26 s | PASS |
| 3 | Start (asks for a CRM) — HubSpot permission sheet on "Connecting your business tools" | 0:39.24 | 0:39.39 | 0:39.60 | 0:42.66 “connecting your” (whisper/dtw/onset) | -3.06 s | PASS (intentional lead: on screen while Michael introduces the topic) |
| 4 | Search inbox off — tile toggles on "individual actions" | 0:49.21 | 0:49.36 | 0:49.50 | 0:49.52 “individual” (window-verified) | -0.02 s | PASS |
| 5 | Google Sheets — spreadsheet limits on "limit which spreadsheets" | 0:50.32 | 0:50.47 | 0:50.70 | 0:50.96 “which spreadsheets” (window-verified) | -0.26 s | PASS |
| 6 | Slack — Slack channels on "which Slack channels" | 0:53.05 | 0:53.20 | 0:53.40 | 0:53.22 “slack channels” (window-verified) | +0.18 s | PASS |
| 7 | Connect HubSpot — HubSpot connected on "Your tools, your permissions" | 0:58.43 | 0:58.58 | 0:58.80 | 0:58.65 “your tools” (window-verified) | +0.15 s | PASS |
| 8 | Start — live run on "Flow begins working" | 1:02.79 | 1:02.94 | 1:03.20 | 1:03.67 “flow begins” (whisper/dtw/onset) | -0.47 s | PASS |
| 9 | Call summary — summary on "Open the call summary" | 1:13.48 | 1:13.63 | 1:13.90 | 1:13.81 “call summary” (window-verified) | +0.09 s | PASS |
| 10 | Transcript — transcript on "read the transcript" | 1:14.60 | 1:14.75 | 1:15.00 | 1:15.03 “transcript” (window-verified) | -0.03 s | PASS |
| 11 | Close transcript — run record on "No mysterious black box" | 1:18.50 | 1:18.65 | 1:18.80 | 1:18.75 “no mysterious” (window-verified) | +0.05 s | PASS |
| 12 | Needs you · HubSpot — approval sheet on "before it makes that change, it asks" | 1:29.81 | 1:29.96 | 1:30.20 | 1:29.98 “but before” (window-verified) | +0.22 s | PASS |
| 13 | Approve — completed result on "Flow continues to the completed result" | 1:36.51 | 1:36.66 | 1:36.90 | 1:37.44 “flow continues” (window-verified) | -0.54 s | PASS |
| 14 | History — History on "Here's another example" | 1:44.36 | 1:44.51 | 1:44.70 | 1:44.61 “here's another” (window-verified) | +0.09 s | PASS |
| 15 | Wrote 2 dates to Invoices — invoice receipt on "from an invoice follow-up" | 1:46.32 | 1:46.47 | 1:46.70 | 1:46.43 “follow-up” (window-verified) | +0.27 s | PASS |
| 16 | Undo · put the old values back — undo approval on "an approval step for that too" | 1:58.86 | 1:59.01 | 1:59.30 | 1:59.91 “approval step” (window-verified) | -0.61 s | PASS |
| 17 | Change composer — change box on "Tell Flow what needs to change" | 2:11.47 | 2:11.62 | 2:12.00 | 2:11.95 “tell flow” (window-verified) | +0.05 s | PASS |
| 18 | Send change — updated plan on "The updated plan shows both changes" | 2:17.92 | 2:18.07 | 2:18.30 | 2:18.91 “the updated” (window-verified) | -0.61 s | PASS |
| 19 | Step 6 needs a billing tool — missing tool on "Flow identifies the missing capability" | 2:27.85 | 2:28.00 | 2:28.30 | 2:28.33 “flow identifies” (window-verified) | -0.03 s | PASS |
| 20 | Use your own tool — MCP link form on "the tool you already use" | 2:31.76 | 2:31.91 | 2:32.60 | 2:32.42 “already” (window-verified) | +0.18 s | PASS |
| 21 | Allow — tool actions on "Then you choose the actions" | 2:35.26 | 2:35.41 | 2:35.70 | 2:35.84 “then you” (whisper/dtw/onset) | -0.14 s | PASS |
| 22 | Use for step 6 — updated plan on "And the updated plan is ready to go" | 2:43.92 | 2:44.07 | 2:44.40 | 2:44.27 “and the updated” (window-verified) | +0.13 s | PASS |
| 23 | Review (Marco) — Marco approval on "One needs a clearer document" | 2:57.15 | 2:57.30 | 2:57.60 | 2:57.62 “clearer” (window-verified) | -0.02 s | PASS |
| 24 | Send text — team list on "Others are still moving forward" | 2:58.30 | 2:58.45 | 2:58.70 | 2:58.83 “others” (window-verified) | -0.13 s | PASS |

## Cuts

| Cut at | Into | Narration cue | Picture leads by | Result |
|---|---|---|---|---|
| 0:47.60 | b_connections | permissions:with flow at 0:47.97 | 0.37 s | PASS |
| 0:54.87 | c_run | permissions:and when at 0:54.92 | 0.05 s | PASS |
| 2:05.13 | d_change_plan | section start (“And…”) at 2:05.29 | 0.16 s | PASS |
| 2:23.30 | e_tools | section start (“And…”) at 2:23.42 | 0.12 s | PASS |
| 2:46.33 | f_team | section start (“And…”) at 2:46.43 | 0.10 s | PASS |
| 3:00.47 | g1_call | team_wfs:calls at 3:00.92 | 0.45 s | PASS |
| 3:01.40 | g2_sms | team_wfs:texts at 3:01.50 | 0.10 s | PASS |
| 3:01.93 | g3_lock | team_wfs:notifications at 3:02.05 | 0.12 s | PASS |
| 3:05.30 | h_home | team_wfs:one place at 3:05.44 | 0.14 s | PASS |
| 3:19.47 | i_welcome | product_close:that's flow at 3:19.71 | 0.24 s | PASS |

## Technical

- Video h264 780x1688 at 30/1 fps, 203.00 s; audio aac 48000 Hz, 202.97 s.
- Narration ends at 200.48 s; the last word (“Flow.”) ends about 200.4 s; the branded closing screen holds to 203.00 s.
- Black frames: none.
- Narration placement, measured by correlating each original WAV with the exported audio:

| Section | Slot | Measured | Offset |
|---|---|---|---|
| intro | 0.00 s | 0.00 s | +0.00 s |
| request_to_plan | 18.80 s | 18.80 s | +0.00 s |
| permissions | 38.72 s | 38.72 s | +0.00 s |
| executions | 61.60 s | 61.60 s | +0.00 s |
| human_approval | 82.08 s | 82.08 s | +0.00 s |
| reciepts_proof | 101.28 s | 101.28 s | +0.00 s |
| change_the_plan | 125.20 s | 125.20 s | +0.00 s |
| bring_your_own_tools | 143.36 s | 143.36 s | +0.00 s |
| team_wfs | 166.40 s | 166.40 s | +0.00 s |
| product_close | 187.68 s | 187.68 s | +0.00 s |

| Check | Result |
|---|---|
| video runs past the last word by ≥1 s | PASS |
| audio covers all narration | PASS |
| no black frames | PASS |
| every section within ±0.05 s of its slot | PASS |
| 780x1688 at 30 fps | PASS |
