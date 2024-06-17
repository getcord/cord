export function findLastIndex<T>(
  arr: ArrayLike<T>,
  pred?: (x: T) => boolean,
  offset?: number,
): number {
  const realPred = pred ?? ((x: T) => !!x);
  for (let i = offset ?? arr.length - 1; i >= 0; i--) {
    if (realPred(arr[i])) {
      return i;
    }
  }

  return -1;
}

export function findLast<T>(
  arr: ArrayLike<T>,
  pred?: (x: T) => boolean,
  offset?: number,
): T | undefined {
  const index = findLastIndex(arr, pred, offset);
  if (index === -1) {
    return undefined;
  } else {
    return arr[index];
  }
}
