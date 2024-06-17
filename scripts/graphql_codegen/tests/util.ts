export function trimAndExpect(got: string, want: string) {
  // remove leading/trailing whitespace on every line of want
  want = want
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
  expect(got).toBe(want);
}
