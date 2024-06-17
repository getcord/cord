import { useCallback } from 'react';

import type { UUID } from 'common/types/index.ts';
import { SLACK_CHANNEL_IDS_SHARED_TO } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { useAddThreadToSlackChannelMutation } from 'external/src/graphql/operations.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useCordTranslation } from '@cord-sdk/react';

export function useShareThreadToSlack() {
  const { t } = useCordTranslation('thread');
  const [addThreadToSlackChannelMutation] =
    useAddThreadToSlackChannelMutation();

  const { logEvent } = useLogger();

  const [slackChannelIDsSharedTo, setSlackChannelIDsSharedTo] = usePreference<
    string[]
  >(SLACK_CHANNEL_IDS_SHARED_TO);

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const recordSlackChannel = useCallback(
    (slackChannelID: string) => {
      setSlackChannelIDsSharedTo([
        slackChannelID,
        ...(slackChannelIDsSharedTo ?? []).filter(
          (id) => id !== slackChannelID,
        ),
      ]);
    },
    [setSlackChannelIDsSharedTo, slackChannelIDsSharedTo],
  );

  return useCallback(
    async ({
      slackChannel,
      threadID,
      installBot,
      isNewThread = false,
    }: {
      slackChannel: SlackChannelType;
      threadID: UUID;
      installBot?: boolean;
      isNewThread?: boolean;
    }) => {
      const { data } = await addThreadToSlackChannelMutation({
        variables: {
          slackChannelID: slackChannel.slackID,
          threadID,
          installBot,
          byExternalID: false,
        },
      });
      if (data?.addThreadToSlackChannel.success) {
        recordSlackChannel(slackChannel.slackID);
        showToastPopup?.(
          t('share_via_slack_action_success', {
            slackChannel: slackChannel.name,
          }),
        );
        logEvent('thread-shared-to-slack', {
          threadID,
          newThread: isNewThread,
        });
      } else {
        showToastPopup?.(t('share_via_slack_action_failure'));
      }
    },
    [
      addThreadToSlackChannelMutation,
      logEvent,
      recordSlackChannel,
      showToastPopup,
      t,
    ],
  );
}
