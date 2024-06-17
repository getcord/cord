export async function asyncFilter<T>(
  arr: T[],
  pred: (elem: T) => Promise<boolean>,
): Promise<T[]> {
  const preds = await Promise.all(arr.map((elem) => pred(elem)));
  return arr.filter((_, idx) => preds[idx]);
}
