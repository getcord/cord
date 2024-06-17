import { useEffect, useMemo, useState } from 'react';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { SLACK_CHANNEL_IDS_SHARED_TO } from 'common/const/UserPreferenceKeys.ts';
import { useLazySlackChannelsQuery } from 'external/src/graphql/operations.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function useSlackChannels() {
  const { enableSlack } = useContextThrowingIfNoProvider(ConfigurationContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const thread = useThreadData();

  const [slackChannels, setSlackChannels] = useState<{
    joinableSlackChannels: SlackChannelType[];
    joinedSlackChannels: SlackChannelType[];
  }>({ joinableSlackChannels: [], joinedSlackChannels: [] });

  const [slackChannelIDsSharedTo] = usePreference<string[]>(
    SLACK_CHANNEL_IDS_SHARED_TO,
  );
  // In some cases, the orgID of the thread will be different from the org in
  // our component context (think unified inbox)
  const orgIDToQuery = useMemo(
    () => thread?.orgID ?? organization?.id,
    [organization?.id, thread?.orgID],
  );

  const [fetchSlackChannels] = useLazySlackChannelsQuery();

  useEffect(() => {
    if (orgIDToQuery && enableSlack) {
      void fetchSlackChannels({
        variables: { orgID: orgIDToQuery },
      }).then((result) => {
        if (!result.data?.organization) {
          setSlackChannels({
            joinableSlackChannels: [],
            joinedSlackChannels: [],
          });
          return;
        }
        const channels = result.data.organization;
        // Put slack channels most recently shared to first
        // Default order for non-shared channels is by number of users (done on back-end)
        if (
          slackChannelIDsSharedTo?.length &&
          channels.joinedSlackChannels.length > 1
        ) {
          const channelsByID = new Map<string, SlackChannelType>();
          const sharedToIDsSet = new Set(slackChannelIDsSharedTo);
          for (const channel of channels.joinedSlackChannels) {
            channelsByID.set(channel.slackID, channel);
          }
          const sortedChannels: SlackChannelType[] = [];
          for (const channelID of slackChannelIDsSharedTo) {
            const channel = channelsByID.get(channelID);
            if (channel) {
              sortedChannels.push(channel);
            }
          }
          sortedChannels.push(
            ...channels.joinedSlackChannels.filter(
              ({ slackID }) => !sharedToIDsSet.has(slackID),
            ),
          );
          channels.joinedSlackChannels = sortedChannels;
        }
        setSlackChannels(channels);
      });
    }
  }, [enableSlack, fetchSlackChannels, orgIDToQuery, slackChannelIDsSharedTo]);

  return slackChannels;
}
