/**
 * Prepend "cord-" to a classname. Useful mostly to grep all places
 * where we've added a stable classname.
 */
export function cordifyClassname(className: string) {
  return `cord-${className}`;
}
