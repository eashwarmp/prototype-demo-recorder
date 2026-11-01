# Builds the showcase: cuts each take at its T0 marker for its window on the master timeline, joins the takes
# and lays Michael's ten original WAVs over them, back to back and untouched. One ffmpeg pass, frame-accurate.
# Usage: python3 assemble.py [takes dir] [narration source dir] [output mp4]
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
TAKES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'takes')
WAVS = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser('~/Downloads')
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, '..', 'output', 'Flow_Showcase_Michael.mp4')
FPS = 30
SECTIONS = ['intro', 'request_to_plan', 'permissions', 'executions', 'human_approval', 'reciepts_proof',
            'change_the_plan', 'bring_your_own_tools', 'team_wfs', 'product_close']

shots = json.loads(subprocess.run(['node', '-e', f"import('{HERE}/showcase.config.mjs').then(m => console.log(JSON.stringify(m.shots.map(({{name, from, to, node, slip}}) => ({{name, from, to, node, slip: slip || 0}})))))"],
                                  capture_output=True, text=True, check=True).stdout)
assert abs(shots[0]['from']) < 1e-9 and all(abs(a['to'] - b['from']) < 1e-9 for a, b in zip(shots, shots[1:])), 'shots must tile the timeline'

inputs, chains, edl = [], [], []
for i, s in enumerate(shots):
    log = json.load(open(os.path.join(TAKES, f"{s['name']}.actions.json")))
    t0 = next(a['t'] for a in log['actions'] if a['type'] == 'cue' and a.get('text') == 'T0')
    first, last = round(s['from'] * FPS), round(s['to'] * FPS)  # master frame range [first, last)
    start = t0 + s['slip'] + (first / FPS - s['from'])  # slip: use the take earlier/later than scheduled
    inputs += ['-i', os.path.join(TAKES, f"{s['name']}.mp4")]
    chains.append(f'[{i}:v]trim=start={start:.4f}:duration={(last - first) / FPS:.4f},setpts=PTS-STARTPTS,fps={FPS}[v{i}]')
    edl.append(dict(shot=s['name'], figma_node=s['node'], slip=s['slip'], master_from=first / FPS, master_to=last / FPS, take_t0=t0, take_in=round(start, 3)))
total = round(shots[-1]['to'] * FPS) / FPS

wavs = []
for sec in SECTIONS:
    cands = sorted(f for f in os.listdir(WAVS) if f.startswith(f'micheal_{sec}') and f.endswith('.wav'))
    if not cands: sys.exit(f'missing narration: micheal_{sec}*.wav in {WAVS}')
    wavs.append(os.path.join(WAVS, cands[0]))
n = len(shots)
for j, w in enumerate(wavs):
    inputs += ['-i', w]
audio = ''.join(f'[{n + j}:a]' for j in range(len(wavs))) + f'concat=n={len(wavs)}:v=0:a=1,apad=whole_dur={total:.4f}[a]'
video = ''.join(f'[v{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=0,format=yuv420p[v]'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(chains + [video, audio]),
       '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-r', str(FPS),
       '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', f'{total:.4f}', '-movflags', '+faststart', OUT]
subprocess.run(cmd, check=True)
json.dump(dict(output=os.path.abspath(OUT), fps=FPS, duration=total, narration=[os.path.basename(w) for w in wavs], shots=edl),
          open(os.path.join(HERE, 'edl.json'), 'w'), indent=1)
print(f'wrote {OUT} ({total:.2f}s, {n} shots)')
