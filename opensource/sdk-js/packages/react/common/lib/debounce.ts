export function debounce<TArgs extends unknown[]>(
  delay: number,
  f: (...args: TArgs) => unknown,
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;
  return (...args: TArgs) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      f(...args);
    }, delay);
  };
}
