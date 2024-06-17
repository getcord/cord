import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useThreadData(): ThreadData | null {
  const { thread } = useContextThrowingIfNoProvider(Thread2Context);
  return thread;
}
