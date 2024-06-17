export default function setTimeoutAsync(
  f: () => Promise<void>,
  ms: number,
): NodeJS.Timeout {
  return setTimeout(() => void f(), ms);
}
