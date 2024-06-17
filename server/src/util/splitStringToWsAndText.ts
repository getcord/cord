// We break the bit of text into three parts: we split off all whitespace
// the beginning (`wsStart`) and end (`wsEnd`). The bit in the middle is
// the remaining text, and that does not begin or end with whitespace.

export function splitStringToWsAndText(string: string) {
  const [_, wsStart, middleText, wsEnd] = string.match(/^(\s*)(.*?)(\s*)$/s)!;

  return [wsStart, middleText, wsEnd];
}
