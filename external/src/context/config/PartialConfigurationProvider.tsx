import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  ConfigurationContextType,
  InternalScreenshotOptions,
} from 'external/src/context/config/ConfigurationContext.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type PartialConfigurationProviderProps = PropsWithChildren<{
  config: Partial<Omit<ConfigurationContextType, 'screenshotOptions'>> & {
    screenshotOptions?: Partial<InternalScreenshotOptions>;
  };
}>;

/**
 * Used to modify the DefaultConfiguration. E.g. Threads are rendered
 * by Sidebar and ThreadList. If you want to disable annotations for the latter,
 * you'd wrap that React tree with this provider and its `config = {enableAnnotations: false}`
 */
export function PartialConfigurationProvider({
  config,
  children,
}: PartialConfigurationProviderProps) {
  const existingConfig = useContextThrowingIfNoProvider(ConfigurationContext);
  const contextValue = useMemo(
    () => ({
      ...existingConfig,
      ...config,
      screenshotOptions: {
        ...existingConfig.screenshotOptions,
        ...config.screenshotOptions,
        captureWhen:
          config.screenshotOptions?.captureWhen !== undefined
            ? config.screenshotOptions?.captureWhen
            : existingConfig.screenshotOptions.captureWhen,
      },
      customRenderers: {
        ...existingConfig.customRenderers,
        ...config.customRenderers,
      },
    }),
    [existingConfig, config],
  );
  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
}
