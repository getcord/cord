import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ThreadName = { threadName: string | null; default: boolean };

export const ThreadNameContext = createContext<
  ThreadName | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

type MaybeThreadNameProps = {
  threadName: string | undefined;
};

export function MaybeThreadNameContext({
  threadName,
  children,
}: React.PropsWithChildren<MaybeThreadNameProps>) {
  if (threadName) {
    return (
      <ThreadNameContext.Provider value={{ threadName, default: false }}>
        {children}
      </ThreadNameContext.Provider>
    );
  } else {
    return <>{children}</>;
  }
}
