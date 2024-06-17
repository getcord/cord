export function trimStart(s: string, c: string): string {
  return trimImpl(s, c, { front: true, end: false });
}

export function trimEnd(s: string, c: string): string {
  return trimImpl(s, c, { front: false, end: true });
}

export function trim(s: string, c: string): string {
  return trimImpl(s, c, { front: true, end: true });
}

function trimImpl(
  s: string,
  c: string,
  { front, end }: { front: boolean; end: boolean },
): string {
  if (c.length !== 1) {
    throw new Error(`${c} must be a single character`);
  }

  let idxStart = 0;
  let idxEnd = s.length;

  if (front) {
    while (idxStart < idxEnd && s[idxStart] === c) {
      idxStart++;
    }
  }

  if (end) {
    while (idxEnd > idxStart && s[idxEnd - 1] === c) {
      idxEnd--;
    }
  }

  return s.slice(idxStart, idxEnd);
}
