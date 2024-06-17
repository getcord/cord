import { useCallback } from 'react';
import { useCordTranslation } from '@cord-sdk/react';

import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuNavigationItem2 } from 'external/src/components/ui2/MenuNavigationItem2.tsx';
import { useShareThreadToSlack } from 'external/src/effects/useShareThreadToSlack.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import type { UUID } from 'common/types/index.ts';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { SlackChannelSelect2 } from 'external/src/components/2/SlackChannelSelect2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { confirmSlackShareText } from 'external/src/common/strings.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';

type Props = {
  onBackButtonClick: () => void;
  threadID: UUID;
  onClose: () => void;
};

/**
 * @deprecated Please use `ui3/SlackChannelsMenu` instead.
 */
export const SlackChannelSelectMenu2 = ({
  onBackButtonClick,
  threadID,
  onClose,
}: Props) => {
  const { t } = useCordTranslation('thread');
  const shareThreadToSlack = useShareThreadToSlack();

  const { logError } = useLogger();

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const share = useCallback(
    (slackChannel: SlackChannelType, joined: boolean) =>
      shareThreadToSlack({ slackChannel, threadID, installBot: !joined })
        .catch((e) => {
          logError('Failed to share thread to Slack', e, {
            threadID,
            slackChannel,
          });
          showToastPopup?.(t('share_via_slack_action_failure'));
        })
        .finally(onClose),
    [shareThreadToSlack, threadID, onClose, logError, showToastPopup, t],
  );

  const { dispatch } = useContextThrowingIfNoProvider(DelegateContext);

  const onShareToSlackButtonClick = useCallback(
    (slackChannel: SlackChannelType, joined: boolean) => {
      const confirmModalText = confirmSlackShareText(slackChannel.name);

      if (joined) {
        void share(slackChannel, joined);
      } else {
        // If you don't close the menu, the click-outside-to-close-menu handler
        // takes precedence over the modal's buttons' handlers - see PR summary
        onClose();
        dispatch({
          type: 'SHOW_CONFIRM_MODAL',
          confirmModal: {
            ...confirmModalText,
            onConfirm: () => {
              void share(slackChannel, joined);
              dispatch({ type: 'HIDE_CONFIRM_MODAL' });
            },
            onReject: () => {
              onClose();
              dispatch({ type: 'HIDE_CONFIRM_MODAL' });
            },
          },
        });
      }
    },
    [dispatch, onClose, share],
  );

  return (
    // Scrollable is set to false as we have a defined scrollable area within <SlackChannelSelect/>
    // which doesn't include the navigation item and the search bar
    <Menu2 scrollable={false}>
      <MenuNavigationItem2
        onClick={onBackButtonClick}
        label={t('share_via_slack_action')}
      />
      <Separator2 />
      <SlackChannelSelect2 onClickChannel={onShareToSlackButtonClick} />
    </Menu2>
  );
};
