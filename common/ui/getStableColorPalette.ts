const TOTAL_NUM_OF_PALETTES = 8;
/**
 * Given an external userID, return a number between 1 and 8.
 */
export function getStableColorPalette(userId: string) {
  let simpleHash = 0;
  for (const char of userId) {
    simpleHash += char.charCodeAt(0);
  }
  return (simpleHash % TOTAL_NUM_OF_PALETTES) + 1; // 1-indexed;
}
