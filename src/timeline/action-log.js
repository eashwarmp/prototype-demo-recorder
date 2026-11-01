/**
 * A list of what happened during one clip, timed in seconds from the clip's start on the same wall clock the
 * frames are resampled against, so a logged tap at 12.41 s is the frame at 12.41 s in the video.
 */
export function createActionLog(now = () => Date.now() / 1000) {
  let start = now();
  let entries = [];
  return {
    reset() {
      start = now();
      entries = [];
    },
    add(type, detail = {}) {
      const entry = { t: +(now() - start).toFixed(2), type, ...detail };
      entries.push(entry);
      return entry;
    },
    get entries() {
      return entries.slice();
    },
  };
}
