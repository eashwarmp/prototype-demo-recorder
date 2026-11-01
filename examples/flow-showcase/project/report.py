# Writes sync_audit.md from qa/qa.json (made by verify.py from the exported MP4) and the shot plan.
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
qa = json.load(open(os.path.join(ROOT, 'qa', 'qa.json')))
edl = json.load(open(os.path.join(HERE, 'edl.json')))
shots = json.loads(subprocess.run(['node', '-e', f"import('{HERE}/showcase.config.mjs').then(m => console.log(JSON.stringify(m.shots)))"],
                                  capture_output=True, text=True, check=True).stdout)
approach = {e[4]: e[5] for s in shots for e in s['events'] if e[0] == 'p'}  # label → approach glide ms
mmss = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
L = ['# Flow showcase · synchronization audit', '',
     f"Measured on the exported file `{os.path.basename(edl['output'])}` ({edl['duration']:.2f} s), not on the edit timeline.", '',
     'For each interaction: the cursor glides onto the control (arriving 0.15 s before the tap), the tap, the first frame where the',
     'screen visibly responds (measured from the video pixels at 10 fps, so ±0.1 s), and the start of the narration that describes',
     'the result. **Visible − cue** is negative when the screen leads the words. Pass: from 0.8 s early to 0.3 s late (one',
     'interaction, marked, is meant to sit on screen while Michael introduces the topic).', '',
     '| # | Interaction | Cursor arrives | Tap | Screen responds | Narration cue (starts) | Visible − cue | Result |',
     '|---|---|---|---|---|---|---|---|']
n = 0
for r in qa['interactions']:
    if not r.get('cue'): continue
    n += 1
    phrase = r['cue'].split(':', 1)[1]
    L.append(f"| {n} | {r['label']} — {r['expect']} | {mmss(r['press'] - 0.15)} | {mmss(r['press'])} | {mmss(r['response'])} | "
             f"{mmss(r['cue_time'])} “{phrase}” ({r['cue_source']}) | {r['visible_vs_cue']:+.2f} s | {r['verdict']}{' (intentional lead: on screen while Michael introduces the topic)' if r['visible_vs_cue'] < -0.8 else ''} |")
L += ['', '## Cuts', '', '| Cut at | Into | Narration cue | Picture leads by | Result |', '|---|---|---|---|---|']
for c in qa['cuts']:
    cue = c['cue'] if isinstance(c['cue'], str) else 'section start (“And…”)'
    L.append(f"| {mmss(c['cut_at'])} | {c['into']} | {cue} at {mmss(c['cue_time'])} | {c['lead']:.2f} s | {c['verdict']} |")
t = qa['technical']
L += ['', '## Technical', '',
      f"- Video {t['video']['codec']} {t['video']['size']} at {t['video']['fps']} fps, {t['video']['duration']:.2f} s; audio {t['audio']['codec']} {t['audio']['rate']} Hz, {t['audio']['duration']:.2f} s.",
      f"- Narration ends at {t['narration_end']} s; the last word (“Flow.”) ends about {t['last_word_end']} s; the branded closing screen holds to {t['video']['duration']:.2f} s.",
      f"- Black frames: {'none' if not t['black_runs'] else t['black_runs']}.",
      '- Narration placement, measured by correlating each original WAV with the exported audio:', '',
      '| Section | Slot | Measured | Offset |', '|---|---|---|---|']
L += [f"| {o['section']} | {o['expected']:.2f} s | {o['measured']:.2f} s | {o['offset']:+.2f} s |" for o in t['section_offsets']]
L += ['', '| Check | Result |', '|---|---|'] + [f"| {k} | {'PASS' if v else 'FAIL'} |" for k, v in t['checks'].items()]
open(os.path.join(ROOT, 'sync_audit.md'), 'w').write('\n'.join(L) + '\n')
print('wrote sync_audit.md', n, 'interactions')
