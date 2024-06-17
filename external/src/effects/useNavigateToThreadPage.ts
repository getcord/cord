import { useCallback } from 'react';

import { useSetDeepLinkThreadIDMutation } from 'external/src/graphql/operations.ts';
import { NavigationOverrideContext } from 'external/src/context/navigation/NavigationOverrideContext.ts';
import type { Location } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type NavigateInformation = {
  url: string | undefined;
  threadID: string;
  externalThreadID: string;
  targetOrgID: string;
  inExtensionPopup?: boolean;
  navigationUrl?: string | undefined;
  navigationTarget?: '_top' | '_blank';
  location?: Location | null;
};

export function useNavigateToThreadPage({
  url,
  threadID,
  externalThreadID,
  targetOrgID,
  navigationUrl = url,
  navigationTarget = '_blank',
  location = null,
}: NavigateInformation) {
  const [setDeepLinkThreadID] = useSetDeepLinkThreadIDMutation();
  const navigateOverride = useContextThrowingIfNoProvider(
    NavigationOverrideContext,
  )?.navigateOverride;

  return useCallback(async () => {
    if (threadID) {
      await setDeepLinkThreadID({ variables: { threadID } });
    }
    if (!navigationUrl || !url) {
      return;
    }

    // Allow for navigation to the original url of the page, so the page sees
    // the url as their url, rather than a potential navigation redirect url
    const navigated = await navigateOverride?.(url, location, {
      orgID: targetOrgID,
      groupID: targetOrgID,
      threadID: externalThreadID,
    });
    if (!navigated) {
      // If unhandled, let's fall back and open the navigation url which may
      // include the redirect handler if set by the application
      window.open(navigationUrl, navigationTarget);
    }
  }, [
    threadID,
    navigationUrl,
    url,
    setDeepLinkThreadID,
    navigateOverride,
    location,
    targetOrgID,
    externalThreadID,
    navigationTarget,
  ]);
}
