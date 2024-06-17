import { useContext } from 'react';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useSlackConnectedLiveQuerySubscription } from 'external/src/graphql/operations.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export function useIsSlackConnected() {
  const { enableSlack } = useContextThrowingIfNoProvider(ConfigurationContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const threadContext = useContext(Thread2Context);

  const threadOrgID =
    threadContext !== NO_PROVIDER_DEFINED
      ? threadContext.thread?.orgID
      : undefined;
  const orgIDToQuery = threadOrgID ?? organization?.id;

  const { data: slackConnectedLiverQueryData } =
    useSlackConnectedLiveQuerySubscription({
      variables: { orgID: orgIDToQuery! },
      skip: !orgIDToQuery || !enableSlack,
    });

  if (!enableSlack) {
    return {
      isOrgConnected: false,
      isUserConnected: false,
    };
  }
  return {
    isOrgConnected:
      slackConnectedLiverQueryData?.slackConnectedLiveQuery.isOrgConnected ??
      false,
    isUserConnected:
      slackConnectedLiverQueryData?.slackConnectedLiveQuery.isUserConnected ??
      false,
  };
}
