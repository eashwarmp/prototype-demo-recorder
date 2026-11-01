# QA on the exported MP4 (not the edit timeline). Three passes:
#  1. Sync: for every critical interaction, cursor arrival → tap → UI response (measured from the video's pixels)
#     → the narration cue whose words describe the result. Pass: result visible between 0.8 s before and
#     0.3 s after the cue (a short lead-in is wanted; lagging the words is not).
#  2. Visual continuity: frames either side of every cut, and the whole video at 1 fps, as sheets to inspect.
#  3. Technical: streams, black frames, narration offset per section against the original WAVs, and that the
#     picture runs past the last spoken word.
# Usage: python3 verify.py [takes dir] [narration source dir]   (reads output/ and edl.json)
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAKES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'takes')
WAVS = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser('~/Downloads')
edl = json.load(open(os.path.join(HERE, 'edl.json')))
MP4 = edl['output']
QA = os.path.join(ROOT, 'qa'); os.makedirs(QA, exist_ok=True)
cues = json.load(open(os.path.join(HERE, 'cues.json')))['cues']
onsets = json.load(open(os.path.join(HERE, 'onsets.json'))) if os.path.exists(os.path.join(HERE, 'onsets.json')) else {}

def cue(key):
    o = onsets.get(key)
    if o and o.get('master') is not None: return o['master'], 'window-verified'
    return cues[key]['master'], 'whisper/dtw/onset'

# label → (narration cue the result must be visible for, what the viewer should see)
CRITICAL = {
    'Qualify new leads': ('request_to_plan:try', 'request filled in after "Let\'s try that last one"'),
    'Send': ('request_to_plan:flow lays', 'plan on "Flow lays out the work"'),
    'Start (asks for a CRM)': ('permissions:connecting your', 'HubSpot permission sheet on "Connecting your business tools"', -4.0),
    'Search inbox off': ('permissions:individual', 'tile toggles on "individual actions"'),
    'Google Sheets': ('permissions:which spreadsheets', 'spreadsheet limits on "limit which spreadsheets"'),
    'Slack': ('permissions:slack channels', 'Slack channels on "which Slack channels"'),
    'Connect HubSpot': ('permissions:your tools', 'HubSpot connected on "Your tools, your permissions"'),
    'Start': ('executions:flow begins', 'live run on "Flow begins working"'),
    'Call summary': ('executions:call summary', 'summary on "Open the call summary"'),
    'Transcript': ('executions:transcript', 'transcript on "read the transcript"'),
    'Close transcript': ('executions:no mysterious', 'run record on "No mysterious black box"'),
    'Needs you · HubSpot': ('human_approval:but before', 'approval sheet on "before it makes that change, it asks"'),
    'Approve': ('human_approval:flow continues', 'completed result on "Flow continues to the completed result"'),
    'History': ("reciepts_proof:here's another", 'History on "Here\'s another example"'),
    'Wrote 2 dates to Invoices': ('reciepts_proof:follow-up', 'invoice receipt on "from an invoice follow-up"'),
    'Undo · put the old values back': ('reciepts_proof:approval step', 'undo approval on "an approval step for that too"'),
    'Change composer': ('change_the_plan:tell flow', 'change box on "Tell Flow what needs to change"'),
    'Send change': ('change_the_plan:the updated', 'updated plan on "The updated plan shows both changes"'),
    'Step 6 needs a billing tool': ('bring_your_own_tools:flow identifies', 'missing tool on "Flow identifies the missing capability"'),
    'Use your own tool': ('bring_your_own_tools:already', 'MCP link form on "the tool you already use"'),
    'Allow': ('bring_your_own_tools:then you', 'tool actions on "Then you choose the actions"'),
    'Use for step 6': ('bring_your_own_tools:and the updated', 'updated plan on "And the updated plan is ready to go"'),
    'Review (Marco)': ('team_wfs:clearer', 'Marco approval on "One needs a clearer document"'),
    'Send text': ('team_wfs:others', 'team list on "Others are still moving forward"'),
}
CUTS = {  # shot → narration cue it must land with
    'b_connections': 'permissions:with flow', 'c_run': 'permissions:and when',
    'd_change_plan': 125.29, 'e_tools': 143.42, 'f_team': 166.43,  # section starts: first word "And…" (whisper)
    'g1_call': 'team_wfs:calls',
    'g2_sms': 'team_wfs:texts', 'g3_lock': 'team_wfs:notifications', 'h_home': 'team_wfs:one place', 'i_welcome': "product_close:that's flow",
}
W, H, FPS10 = 130, 281, 10

def gray_frames(path):
    raw = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', path, '-vf', f'fps={FPS10},scale={W}:{H},format=gray',
                          '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
    n = W * H
    return [raw[i:i + n] for i in range(0, len(raw) - n + 1, n)]

def change(a, b, mask=None):
    diff = 0; total = 0
    for i in range(0, len(a)):
        if mask and mask(i % W, i // W): continue
        total += 1
        if abs(a[i] - b[i]) > 30: diff += 1
    return diff / max(1, total)

frames = gray_frames(MP4)
sx, sy = W / 390, H / 844
rows, fails = [], []
for s in edl['shots']:
    log = json.load(open(os.path.join(TAKES, f"{s['shot']}.actions.json")))
    t0 = s['take_t0']
    glides = [a for a in log['actions'] if a['type'] == 'tap']
    late = [a['text'] for a in log['actions'] if a['type'] == 'note' and a['text'].startswith('late')]
    for tap in glides:
        press = round(s['master_from'] + (tap['t'] - s['take_in']), 2)
        if not (s['master_from'] <= press < s['master_to']): continue
        cx, cy = tap['x'] * sx, tap['y'] * sy
        mask = lambda x, y: abs(x - cx) < 14 and abs(y - cy) < 14  # cursor dot, about 30 design points
        i0 = int(press * FPS10)
        base = frames[max(0, i0 - 1)]
        # Whole-screen change, or for small controls (a toggle, a text box) a strong change right around the tap.
        near = lambda x, y: not (abs(x - cx) < 60 * sx and abs(y - cy) < 40 * sy) or mask(x, y)
        resp = next((round(i / FPS10, 2) for i in range(i0 + 1, min(len(frames), i0 + 25))
                     if change(base, frames[i], mask) > 0.015 or change(base, frames[i], near) > 0.05), None)
        row = dict(shot=s['shot'], label=tap['label'], press=press, response=resp, latency=None if resp is None else round(resp - press, 2))
        if tap['label'] in CRITICAL:
            key, what, *lead = CRITICAL[tap['label']]; lead = lead[0] if lead else -0.8
            c, src = cue(key)
            row.update(cue=key, cue_time=c, cue_source=src, expect=what)
            if resp is None:
                row['verdict'] = 'FAIL: no visible response'
            else:
                d = round(resp - c, 2); row['visible_vs_cue'] = d
                row['verdict'] = 'PASS' if lead <= d <= 0.3 else ('LEAD (early)' if d < lead else 'FAIL: late')
            if not row['verdict'].startswith('PASS'): fails.append(row)
        rows.append(row)
    for l in late: rows.append(dict(shot=s['shot'], label='scheduler', note=l))

# Strips for every critical interaction: cursor 0.5 s before → press → response → cue
strip_dir = os.path.join(QA, 'interactions'); os.makedirs(strip_dir, exist_ok=True)
for k, r in enumerate([r for r in rows if r.get('cue')]):
    ts = [max(0, r['press'] - 0.5), r['press'], r['response'] or r['press'] + 0.4, r['cue_time']]
    args = []
    for t in ts: args += ['-ss', f'{t:.2f}', '-i', MP4]
    flt = ''.join(f'[{i}:v]scale=260:-1[s{i}];' for i in range(4)) + ''.join(f'[s{i}]' for i in range(4)) + 'hstack=4'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args, '-filter_complex', flt, '-frames:v', '1',
                    os.path.join(strip_dir, f"{k:02d}_{r['label'][:24].replace(' ', '_').replace('/', '-')}.png")], check=True)

# Pass 2: cuts and full-length sheets
cut_rows = []
for s in edl['shots'][1:]:
    t = s['master_from']; key = CUTS.get(s['shot'])
    c = (key if isinstance(key, float) else cue(key)[0]) if key else None
    cut_rows.append(dict(cut_at=t, into=s['shot'], cue=key, cue_time=c, lead=None if c is None else round(c - t, 2),
                         verdict='NO CUE' if c is None else ('PASS' if 0 <= c - t <= 0.8 else 'CHECK')))
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{t - 0.2:.2f}', '-i', MP4, '-ss', f'{t + 0.1:.2f}', '-i', MP4,
                    '-filter_complex', '[0:v]scale=300:-1[a];[1:v]scale=300:-1[b];[a][b]hstack', '-frames:v', '1',
                    os.path.join(QA, f'cut_{t:07.2f}_{s["shot"]}.png')], check=True)
dur = edl['duration']
for part in range(0, int(dur) + 1, 50):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(part), '-t', '50', '-i', MP4,
                    '-vf', 'fps=1,scale=150:-1,tile=10x5', '-frames:v', '1', os.path.join(QA, f'full_{part:03d}s.png')], check=True)

# Pass 3: technical
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', MP4], capture_output=True, text=True).stdout)
vs = next(x for x in probe['streams'] if x['codec_type'] == 'video'); as_ = next(x for x in probe['streams'] if x['codec_type'] == 'audio')
black = subprocess.run(['ffmpeg', '-hide_banner', '-i', MP4, '-vf', 'blackdetect=d=0.1:pix_th=0.10', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
black_runs = [l.split('blackdetect ')[1] for l in black.splitlines() if 'black_start' in l]

def env(path, start=0, dur=None):
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(start), *(['-t', str(dur)] if dur else []), '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    import struct
    a = struct.unpack(f'<{len(raw) // 2}h', raw); hop = 80
    return [sum(abs(x) for x in a[i:i + hop]) / hop for i in range(0, len(a) - hop, hop)]

offsets = []
SECTIONS = ['intro', 'request_to_plan', 'permissions', 'executions', 'human_approval', 'reciepts_proof',
            'change_the_plan', 'bring_your_own_tools', 'team_wfs', 'product_close']
OFF = json.load(open(os.path.join(HERE, 'cues.json')))['offsets']
for sec, off, wav in zip(SECTIONS, OFF, edl['narration']):
    ref = env(os.path.join(WAVS, wav), 0, 6)
    start = max(0, off - 0.5)
    got = env(MP4, start, 7)
    best = max(range(0, 100), key=lambda lag: sum(r * g for r, g in zip(ref, got[lag:lag + len(ref)])))
    measured = round(start + best / 100, 2)
    offsets.append(dict(section=sec, expected=off, measured=measured, offset=round(measured - off, 2)))
last_word = OFF[-1] + 12.32 + 0.4  # "Flow." starts 12.32 s into the closing WAV, about 0.4 s long
tech = dict(video=dict(codec=vs['codec_name'], size=f"{vs['width']}x{vs['height']}", fps=vs['r_frame_rate'], duration=float(vs['duration'])),
            audio=dict(codec=as_['codec_name'], rate=as_['sample_rate'], duration=float(as_['duration'])),
            narration_end=200.48, last_word_end=round(last_word, 2), black_runs=black_runs, section_offsets=offsets)
tech['checks'] = {
    'video runs past the last word by ≥1 s': float(vs['duration']) >= last_word + 1.0,
    'audio covers all narration': float(as_['duration']) >= 200.4,
    'no black frames': not black_runs,
    'every section within ±0.05 s of its slot': all(abs(o['offset']) <= 0.05 for o in offsets),
    '780x1688 at 30 fps': f"{vs['width']}x{vs['height']}" == '780x1688' and vs['r_frame_rate'] == '30/1',
}
json.dump(dict(interactions=rows, cuts=cut_rows, technical=tech), open(os.path.join(QA, 'qa.json'), 'w'), indent=1)
print('INTERACTIONS')
for r in rows:
    if r.get('cue'):
        print(f"  {r['press']:7.2f} {r['label']:32} resp {r['response']}  cue {r['cue_time']:7.2f} ({r['cue']})  visible-cue {r.get('visible_vs_cue')}  {r['verdict']}")
    elif r.get('note'): print('  NOTE', r['shot'], r['note'])
print('CUTS'); [print(' ', c) for c in cut_rows]
print('TECH'); print(json.dumps(tech['checks'], indent=1)); print(' offsets', [(o['section'], o['offset']) for o in offsets]); print(' black', black_runs)
print('FAILS', len(fails))
