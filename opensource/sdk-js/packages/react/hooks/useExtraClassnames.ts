export function useExtraClassnames(classes: string | number | boolean | null) {
  if (typeof classes !== 'string') {
    return null;
  }

  // It is a string, user may have separated with `,` or space.
  return classes
    .replace(/,/g, ' ')
    .split(' ')
    .map((cls) => cls.trim())
    .filter(Boolean);
}
