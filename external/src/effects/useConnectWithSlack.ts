import { useCallback, useContext, useEffect, useState } from 'react';
import { useAccessTokenQuery } from 'external/src/graphql/operations.ts';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { openPopupWindow } from 'external/src/lib/auth/utils.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type Props = {
  onSuccess: () => void;
  onError: () => void;
};

export function useConnectWithSlack({ onSuccess, onError }: Props) {
  const { enableSlack } = useContextThrowingIfNoProvider(ConfigurationContext);
  const { slackEvents } = useContextThrowingIfNoProvider(GlobalEventsContext);
  const orgContext = useContextThrowingIfNoProvider(OrganizationContext);

  const threadContext = useContext(Thread2Context);

  // Fallback to org context
  const threadExternalOrgID =
    threadContext !== NO_PROVIDER_DEFINED
      ? threadContext.thread?.externalOrgID
      : undefined;

  const orgIDToQuery =
    threadExternalOrgID ?? orgContext.organization?.externalID;

  const { data: accessTokenData } = useAccessTokenQuery({
    variables: {
      _externalOrgID: orgIDToQuery,
    },
    skip: !orgIDToQuery || !enableSlack,
  });

  const token = accessTokenData?.viewer.accessToken;

  const [startSDKFlow, setStartSDKFlow] = useState(false);

  useEffect(() => {
    if (token && startSDKFlow) {
      // This will overwrite previous values of onSuccess and onError but that's
      // fine since this is the most recent user interaction that we care about.
      slackEvents.onSlackConnectSuccessRef.current = onSuccess;
      slackEvents.onSlackConnectErrorRef.current = onError;
      openPopupWindow(
        `${API_ORIGIN}/auth/slack/linking-confirmation?authToken=${token}`,
      );
      setStartSDKFlow(false);
    }
  }, [
    onError,
    onSuccess,
    slackEvents.onSlackConnectErrorRef,
    slackEvents.onSlackConnectSuccessRef,
    startSDKFlow,
    token,
  ]);

  const connectWithSlackFlow = useCallback(() => {
    setStartSDKFlow(true);
  }, []);

  return connectWithSlackFlow;
}
