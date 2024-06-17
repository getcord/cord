/**
 * Converts an amount of seconds to `hh:mm:ss` format.
 * @example
 * secondsToFormattedTimestamp(2061); // "34:21"
 */
export function secondsToFormattedTimestamp(durationSeconds: number) {
  const hrs = Math.floor(durationSeconds / 3600);
  const mins = Math.floor((durationSeconds % 3600) / 60);
  const secs = Math.floor(durationSeconds) % 60;

  let timestamp = '';
  if (hrs > 0) {
    timestamp += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }
  timestamp += '' + mins + ':' + (secs < 10 ? '0' : '');
  timestamp += '' + secs;
  return timestamp;
}
