import { useMemo } from 'react';
import { throttle } from 'radash';

import { useSetTypingMutation } from 'external/src/graphql/operations.ts';
import { TYPING_USER_THROTTLE_MS } from 'common/const/Timing.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useTypingUpdater() {
  const [setTyping] = useSetTypingMutation();
  const { threadMode, threadID } =
    useContextThrowingIfNoProvider(Thread2Context);
  const isDraftThread = threadMode === 'newThread';

  return useMemo(() => {
    return throttle(
      { interval: TYPING_USER_THROTTLE_MS },
      (hasValue: boolean) => {
        if (!threadID) {
          throw new Error("Can't mark typing without an active thread");
        }
        if (isDraftThread) {
          return;
        }

        void setTyping({
          variables: {
            threadID,
            typing: hasValue,
          },
        });
      },
    );
  }, [isDraftThread, setTyping, threadID]);
}
