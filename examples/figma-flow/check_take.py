# Timing check for a recorded take: tap response latency and screen hold lengths, from the video itself.
# Usage: python3 check_take.py <dir with lead_qualification_walkthrough.mp4 and .actions.json>
import glob, json, os, shutil, subprocess, sys

out = sys.argv[1]
name = 'lead_qualification_walkthrough'
work = os.path.join(os.path.dirname(__file__), 'frames')
shutil.rmtree(work, ignore_errors=True)
os.makedirs(work)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', f'{out}/{name}.mp4',
                '-vf', 'fps=10,scale=130:-1,format=gray', f'{work}/f%05d.png'], check=True)
frames = [subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True).stdout for f in sorted(glob.glob(f'{work}/f*.png'))]
d = [0] + [sum(abs(x - y) > 30 for x, y in zip(frames[i - 1], frames[i])) / len(frames[i]) for i in range(1, len(frames))]

log = json.load(open(f'{out}/{name}.actions.json'))
print(f"length {log['seconds']}s real, {log['videoSeconds']}s video, drift {log['drift']}s, warnings {log['warnings']}")
print('tap -> first screen change:')
for t in (a for a in log['actions'] if a['type'] == 'tap'):
    i0 = int(t['t'] * 10) + 1
    lat = next((round(i / 10 - t['t'], 1) for i in range(i0, min(i0 + 40, len(d))) if d[i] > 0.02), None)
    print(f"  {t['t']:7.2f}s  {t['label']:<22} change {t['change']:.3f}  responds in {lat}s")
print('screens held (no big change) >= 2.5s:')
start = 0
for i in range(1, len(d) + 1):
    if i == len(d) or d[i] > 0.02:
        if (i - start) / 10 >= 2.5:
            print(f'  {start / 10:6.1f}s  held {(i - start) / 10:4.1f}s')
        start = i
