# Fourth, independent onset estimate for critical cue words: transcribe short windows of the narration that start
# at different times and binary-search the latest start at which the cue word is still heard first. A word
# clipped by more than ~0.05 s stops being recognized, so that start time is (just after) the word's onset.
# Usage: python3 window_check.py  → writes onsets.json next to cues.json.
import json, os, re, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
NARR = os.path.join(HERE, 'narration')
MODEL = os.path.expanduser('~/.cache/whisper-cpp/ggml-base.en.bin')
cues = json.load(open(os.path.join(HERE, 'cues.json')))
CRITICAL = [
    'intro:introducing flow', 'request_to_plan:try', 'request_to_plan:flow lays',
    "permissions:here's something", 'permissions:individual', 'permissions:which spreadsheets', 'permissions:slack channels',
    'permissions:your tools', 'executions:start', 'executions:call summary', 'executions:transcript', 'executions:no mysterious',
    'human_approval:but before', 'human_approval:it asks', 'human_approval:tap', 'human_approval:flow continues',
    "reciepts_proof:here's another", 'reciepts_proof:follow-up', 'reciepts_proof:back,', 'reciepts_proof:approval step',
    'change_the_plan:tell flow', 'change_the_plan:the updated', 'bring_your_own_tools:flow identifies', 'bring_your_own_tools:already',
    'bring_your_own_tools:mcp', 'bring_your_own_tools:actions', 'bring_your_own_tools:creating', 'bring_your_own_tools:refunding',
    'bring_your_own_tools:and the updated', 'team_wfs:clearer', 'team_wfs:others', 'team_wfs:calls', 'team_wfs:texts',
    'team_wfs:notifications', 'team_wfs:one place', "product_close:that's flow",
]
norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower())
tmp = tempfile.mkdtemp()

def first_words(sec, start):
    path = os.path.join(tmp, 'w.wav')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{max(0, start):.3f}', '-t', '1.6',
                    '-i', os.path.join(NARR, f'{sec}.wav'), '-af', 'apad=pad_dur=0.5', path], check=True)
    out = subprocess.run(['whisper-cli', '-m', MODEL, '-f', path, '-np', '-ng', '-nt'], capture_output=True, text=True).stdout
    return [norm(w) for w in out.split() if norm(w)]

def heard(sec, start, phrase):
    # The cue phrase (its first two words, 4-letter prefixes) still appears among the first words of the window.
    # True while the window starts before the cue word; false once the word is clipped. Two words keep a
    # repeated word ("your tools, your permissions") from matching its later repeat.
    ws = first_words(sec, start)[:5]
    keys = [norm(w)[:4] for w in phrase.split()[:2]]
    return any(all(i + k < len(ws) and ws[i + k].startswith(keys[k]) for k in range(len(keys))) for i in range(len(ws)))

result = {}
for key in CRITICAL:
    c = cues['cues'][key]; sec = c['section']; word = c['phrase']; t = c['t']
    lo, hi = t - 0.45, t + 0.45   # invariant: heard at lo, not heard at hi
    if not heard(sec, lo, word):
        result[key] = dict(t_whisper_dtw_onset=t, window=None, note='not heard at lower bound'); print(key, 'not heard at', lo); continue
    if heard(sec, hi, word):
        result[key] = dict(t_whisper_dtw_onset=t, window=None, note='still heard at upper bound'); print(key, 'still heard at', hi); continue
    while hi - lo > 0.04:
        mid = (lo + hi) / 2
        if heard(sec, mid, word): lo = mid
        else: hi = mid
    onset = round(lo - 0.03, 2)
    result[key] = dict(t_whisper_dtw_onset=t, window=onset, master=round(c['master'] - t + onset, 2), diff=round(onset - t, 2))
    print(f'{key:40} estimate {t:6.2f}  window {onset:6.2f}  diff {onset - t:+.2f}')
json.dump(result, open(os.path.join(HERE, 'onsets.json'), 'w'), indent=1)
