export function isHelpMessage(text: string) {
  return /^\W*help\W*$/i.test(text);
}
