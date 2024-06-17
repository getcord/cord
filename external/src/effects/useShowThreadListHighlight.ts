import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';

export const useShowThreadListHighlight = () => {
  const componentName = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const openFloatingThreadID = useContextThrowingIfNoProvider(
    FloatingThreadsContext,
  )?.openThreadID;

  const threadContext = useContextThrowingIfNoProvider(Thread2Context);

  const { highlightOpenFloatingThread, highlightThreadExternalID } =
    useContextThrowingIfNoProvider(ThreadListContext);

  if (componentName !== 'cord-thread-list') {
    return false;
  }

  if (highlightThreadExternalID) {
    return highlightThreadExternalID === threadContext.thread?.externalID;
  }

  if (highlightOpenFloatingThread) {
    return openFloatingThreadID === threadContext.thread?.id;
  }

  return false;
};
