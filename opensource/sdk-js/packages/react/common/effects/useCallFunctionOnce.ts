import { useCallback, useRef } from 'react';

export function useCallFunctionOnce(fn?: (...args: any[]) => unknown) {
  const calledAlready = useRef<boolean>(false);

  return useCallback(
    (...args: any[]) => {
      if (!calledAlready.current) {
        fn?.(...args);
        calledAlready.current = true;
      }
    },
    [fn],
  );
}
