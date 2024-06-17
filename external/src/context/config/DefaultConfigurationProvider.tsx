import type { PropsWithChildren } from 'react';
import type { ConfigurationContextType } from 'external/src/context/config/ConfigurationContext.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';

const DefaultConfiguration: Omit<ConfigurationContextType, 'enableSlack'> = {
  // these defaults will be used unless overridden by some explicit piece of
  // config, so they should be the values we want in the extension on a default
  // page
  enableTasks: true,
  enableAnnotations: true,
  screenshotOptions: {
    blur: false,
    showBlurred: 'outside_page',
    captureWhen: ['new-annotation', 'share-via-email'],
    showScreenshot: true,
  },
  customRenderers: {},
};

/**
 * Every React tree should be wrapped with this provider.
 * If you want parts of the tree to have a different configuration,
 * use `PartialConfigurationProvider`.
 */
export function DefaultConfigurationProvider({
  children,
}: PropsWithChildren<unknown>) {
  const enableSlack = useFeatureFlag(FeatureFlags.ENABLE_SLACK_FEATURES);
  return (
    <ConfigurationContext.Provider
      value={{ ...DefaultConfiguration, enableSlack }}
    >
      {children}
    </ConfigurationContext.Provider>
  );
}
