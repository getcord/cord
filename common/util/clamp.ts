export function clamp(n: number, lower: number, upper: number): number {
  return Math.max(Math.min(n, upper), lower);
}
