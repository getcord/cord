import { useCallback } from 'react';
import { useCordTranslation } from '@cord-sdk/react';

import { useLogger } from 'external/src/logging/useLogger.ts';
import { Menu } from 'external/src/components/ui3/Menu.tsx';
import type { UUID } from 'common/types/index.ts';
import { MenuNavigationItem } from 'external/src/components/ui3/MenuNavigationItem.tsx';
import { Separator } from 'external/src/components/ui3/Separator.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useShareThreadToSlack } from 'external/src/effects/useShareThreadToSlack.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { confirmSlackShareText } from 'external/src/common/strings.ts';
import { SlackChannelsList } from 'external/src/components/ui3/SlackChannelsList.tsx';

type Props = {
  onBackButtonClick: () => void;
  threadID: UUID;
  onClose: () => void;
};

export const SlackChannelsMenu = ({
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
        // https://github.com/getcord/monorepo/pull/2854
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
    <Menu>
      <MenuNavigationItem
        label={t('share_via_slack_action')}
        onClick={onBackButtonClick}
      />
      <Separator />
      <SlackChannelsList onClickChannel={onShareToSlackButtonClick} />
    </Menu>
  );
};
