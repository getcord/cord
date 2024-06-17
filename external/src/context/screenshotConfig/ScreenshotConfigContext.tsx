import { createContext, useMemo } from 'react';

import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { ScreenshotConfig } from '@cord-sdk/types';

export const ScreenshotConfigContext = createContext<
  ScreenshotConfig | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ScreenshotConfigProvider({
  children,
  screenshotConfig,
}: React.PropsWithChildren<{
  screenshotConfig: ScreenshotConfig;
}>) {
  const ctx = useMemo(() => screenshotConfig, [screenshotConfig]);

  return (
    <ScreenshotConfigContext.Provider value={ctx}>
      {children}
    </ScreenshotConfigContext.Provider>
  );
}
