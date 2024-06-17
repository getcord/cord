import { useMemo, useState, useCallback } from 'react';

import type { AnnotatingConfig } from 'external/src/context/annotationConfig/AnnotatingConfigContext.ts';
import { AnnotatingConfigContext } from 'external/src/context/annotationConfig/AnnotatingConfigContext.ts';

export function AnnotatingConfigProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const [annotatingConfig, setAnnotatingConfig] =
    useState<AnnotatingConfig | null>(null);

  const completeAnnotating = useCallback(() => {
    setAnnotatingConfig(null);
  }, []);

  const cancelAnnotating = useCallback(() => {
    setAnnotatingConfig(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      annotatingConfig,
      startAnnotating: setAnnotatingConfig,
      completeAnnotating,
      cancelAnnotating,
    }),
    [annotatingConfig, cancelAnnotating, completeAnnotating],
  );

  return (
    <AnnotatingConfigContext.Provider value={contextValue}>
      {children}
    </AnnotatingConfigContext.Provider>
  );
}
