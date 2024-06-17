import { useMemo, useState } from 'react';
import type { UUID } from 'common/types/index.ts';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';

export function FloatingThreadsProvider({
  children,
}: React.PropsWithChildren<{ disabled?: boolean }>) {
  const [openThreadID, setOpenThreadID] = useState<UUID | null>(null);

  const contextValue = useMemo(
    () => ({
      openThreadID,
      setOpenThreadID,
    }),
    [openThreadID],
  );

  return (
    <FloatingThreadsContext.Provider value={contextValue}>
      {children}
    </FloatingThreadsContext.Provider>
  );
}
