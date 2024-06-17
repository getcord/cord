/**
 * Assuming `arr` is sorted according to `pred`, return a new array with `elem`
 * inserted in the correct position such that the result is still sorted.
 */
export function sortedInsert<T>(
  arr: T[],
  elem: T,
  pred: (i: T) => string,
): T[] {
  if (arr.length === 0) {
    return [elem];
  }

  const elemVal = pred(elem);

  // Goes first.
  if (pred(arr[0]) >= elemVal) {
    return [elem, ...arr];
  }

  // Goes last.
  if (pred(arr[arr.length - 1]) <= elemVal) {
    return [...arr, elem];
  }

  // Goes in the middle. This could be a binary search since `arr` is sorted,
  // but not a good utility function to do that (unless we take up the lodash
  // fight again which we shouldn't).
  const insertIndex = arr.findIndex((candidate) => pred(candidate) >= elemVal);
  return [
    ...arr.slice(0, insertIndex),
    elem,
    ...arr.slice(insertIndex, arr.length),
  ];
}
