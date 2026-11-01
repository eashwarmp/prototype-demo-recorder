# Cue times for the narration master: three independent estimates per cue phrase, then the chosen time.
#   whisper = word start from whisper.cpp word-level segments
#   dtw     = whisper.cpp DTW token time for the first word (independent alignment pass)
#   onset   = audio energy onset nearest the word (only where the word follows a dip in level)
# Writes cues.json (section-relative and master times).
import json, re, struct, subprocess, wave
D = __import__('os').path.join(__import__('os').path.dirname(__file__), 'narration')
SECS = ['intro', 'request_to_plan', 'permissions', 'executions', 'human_approval', 'reciepts_proof',
        'change_the_plan', 'bring_your_own_tools', 'team_wfs', 'product_close']
DUR = [18.8, 19.92, 22.88, 20.48, 19.2, 23.92, 18.16, 23.04, 21.28, 12.8]
OFF = [round(sum(DUR[:i]), 2) for i in range(len(DUR))]
CUES = {
    'intro': ['introducing flow', 'just tell flow', 'type it', 'say it', 'ready-to-use', 'it feels like', 'just flow'],
    'request_to_plan': ['chasing', 'handling', 'qualifying', "let's try", 'try', "we've got", 'flow lays', 'five leads', 'with the steps', 'and before', 'review the plan'],
    'permissions': ["here's something", 'connecting your', 'with flow', 'individual', 'limit', 'which spreadsheets', 'decide', 'slack channels', 'post to', 'and when', 'approval', 'your tools'],
    'executions': ["let's hit", 'start', 'flow begins', 'see what\'s happening', 'open the', 'call summary', 'read the', 'transcript', 'see what flow', 'no mysterious', 'clear record'],
    'human_approval': ['here, flow', 'qualified', 'ready to add', 'but before', 'change,', 'it asks', 'inspect', 'approve the', 'decline', 'one tap', 'tap', 'flow continues', 'completed', "you're still"],
    'reciepts_proof': ["here's another", 'invoice', 'follow-up', 'green', 'why a', 'which values', 'who approved', 'accepted', 'put things', 'back,', 'approval step', 'accountability'],
    'change_the_plan': ['plans change', 'customer', 'more time', 'tell flow', 'leaving', 'extending', 'the updated', 'both changes', 'undo'],
    'bring_your_own_tools': ["here's a", 'flow identifies', 'gives you', 'already', 'mcp', 'then you', 'actions', 'creating', 'with approval', 'refunding', 'stays off', 'and the updated', 'ready to go'],
    'team_wfs': ['flow can organize', 'entire team', 'six drivers', 'one needs', 'clearer', 'others', 'calls', 'texts', 'notifications', 'one place'],
    'product_close': ['real work', 'you decide', 'flow helps', 'coordinate', 'stay in charge', "that's flow"],
}
norm = lambda w: re.sub(r"[^a-z0-9'-]", '', w.lower())

def words(sec):
    d = json.load(open(f'{D}/{sec}.json'))
    return [(s['text'].strip(), s['offsets']['from'] / 1000) for s in d['transcription'] if s['text'].strip()]

def dtw_words(sec):
    d = json.load(open(f'{D}/dtw/{sec}.json'))
    out = []
    for s in d['transcription']:
        for t in s['tokens']:
            tx = t['text']
            if tx.startswith('[') or t.get('t_dtw', -1) < 0:
                continue
            if tx.startswith(' ') or not out:
                out.append([tx.strip(), t['t_dtw'] / 100])
            else:
                out[-1][0] += tx
    return out

def envelope(sec):
    with wave.open(f'{D}/{sec}.wav') as w:
        n = w.getnframes(); raw = w.readframes(n)
    a = struct.unpack(f'<{n}h', raw)
    hop = 160  # 10 ms at 16 kHz
    return [(sum(x * x for x in a[i:i + hop]) / hop) ** 0.5 for i in range(0, n - hop, hop)]

def onset(env, t):
    i0, i1 = max(0, int((t - 0.25) * 100)), min(len(env) - 1, int((t + 0.12) * 100))
    if i1 <= i0: return None
    lo = min(range(i0, i1), key=lambda i: env[i])
    hi = max(env[lo:min(len(env), lo + 30)])
    if hi < 3 * (env[lo] + 1) or env[lo] > 0.25 * max(env):  # no real dip before the word
        return None
    thr = env[lo] + 0.3 * (hi - env[lo])
    j = next((k for k in range(lo, min(len(env), lo + 30)) if env[k] >= thr), None)
    return None if j is None else round(j / 100, 2)

result = {}
for si, sec in enumerate(SECS):
    W, T, E = words(sec), dtw_words(sec), envelope(sec)
    nw = [norm(w) for w, _ in W]; nt = [norm(w) for w, _ in T]
    for phrase in CUES[sec]:
        p = [norm(x) for x in phrase.split()]
        hits = [i for i in range(len(nw)) if nw[i:i + len(p)] == p]
        if not hits:
            print('NOT FOUND', sec, phrase); continue
        i = hits[0]; ws = W[i][1]
        th = [j for j in range(len(nt)) if nt[j:j + len(p)] == p]
        dt = min((T[j][1] for j in th), key=lambda v: abs(v - ws), default=None)
        on = onset(E, ws)
        est = [v for v in (ws, dt, on) if v is not None and abs(v - ws) < 0.5]
        est.sort(); chosen = est[len(est) // 2] if len(est) % 2 else round((est[len(est) // 2 - 1] + est[len(est) // 2]) / 2, 2)
        spread = round(max(est) - min(est), 2)
        result[f'{sec}:{phrase}'] = dict(section=sec, phrase=phrase, whisper=ws, dtw=dt, onset=on, t=round(chosen, 2), master=round(OFF[si] + chosen, 2), spread=spread)
        print(f"{sec:22} {phrase:22} whisper {ws:6.2f}  dtw {dt if dt is not None else '  -  ':>6}  onset {on if on is not None else ' - ':>5}  -> {chosen:6.2f}  master {OFF[si] + chosen:7.2f}  spread {spread}")
json.dump(dict(offsets=OFF, durations=DUR, cues=result), open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'cues.json'), 'w'), indent=1)
