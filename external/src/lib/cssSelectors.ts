export function hasProperty(property: string) {
  return `[${property}]`;
}

export function classContains(value: string) {
  return `[class*="${value}"]`;
}
