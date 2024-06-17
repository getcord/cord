export const throttle = <TArgs extends any[]>(
  { interval }: { interval: number },
  func: (...args: TArgs) => any,
) => {
  let ready = true;
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;

  const throttled = (...args: TArgs) => {
    if (!ready) {
      return;
    }
    func(...args);
    ready = false;
    timer = setTimeout(() => {
      ready = true;
      timer = undefined;
    }, interval);
  };
  throttled.isThrottled = () => {
    return timer !== undefined;
  };
  return throttled;
};
