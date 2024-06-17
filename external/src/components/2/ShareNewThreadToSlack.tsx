import { useCallback, useState } from 'react';
import { useCordTranslation } from '@cord-sdk/react';
import { SlackChannelSelect2 } from 'external/src/components/2/SlackChannelSelect2.tsx';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { confirmSlackShareText } from 'external/src/common/strings.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  slackChannelToShareTo: SlackChannelType | null;
  setSlackChannelToShareTo: any;
};

export function ShareNewThreadToSlack({
  slackChannelToShareTo,
  setSlackChannelToShareTo,
}: Props) {
  const { t } = useCordTranslation('thread');
  const [showShareToSlackMenu, setShowShareToSlackMenu] = useState(false);

  const { logEvent } = useLogger();

  const { showConfirmModal } = useContextThrowingIfNoProvider(EmbedContext);

  const onShareToSlackButtonClicked = useCallback(
    (slackChannel: SlackChannelType, joined: boolean) => {
      const confirmModalText = confirmSlackShareText(slackChannel.name);

      if (joined) {
        setSlackChannelToShareTo(slackChannel);
        setShowShareToSlackMenu(false);
      } else {
        showConfirmModal({
          ...confirmModalText,
          onConfirm: () => {
            setSlackChannelToShareTo(slackChannel);
            setShowShareToSlackMenu(false);
          },
          onCancel: () => {
            setShowShareToSlackMenu(false);
          },
        });
      }
    },
    [showConfirmModal, setSlackChannelToShareTo],
  );

  const onButtonClick = () => {
    if (slackChannelToShareTo) {
      logEvent('click-draft-thread-remove-share-to-slack-selection');
      setSlackChannelToShareTo(null);
    } else {
      logEvent('click-draft-thread-share-to-slack');
      setShowShareToSlackMenu(true);
    }
  };

  const SlackChannelsMenu = (
    // scroll behaviour is managed inside SlackChannelSelect
    <Menu2 fullWidth={true} maxHeight={'40vh'} scrollable={false}>
      <SlackChannelSelect2 onClickChannel={onShareToSlackButtonClicked} />
    </Menu2>
  );
  return (
    <>
      <BoxWithPopper2
        popperElement={SlackChannelsMenu}
        popperElementVisible={showShareToSlackMenu}
        popperPosition={'bottom-end'}
        onShouldHide={() => setShowShareToSlackMenu(false)}
        popperWidth={200}
        withBlockingOverlay={true}
      >
        <Button2
          buttonType="secondary"
          size="medium"
          icon="Slack"
          onClick={onButtonClick}
        >
          {slackChannelToShareTo
            ? t('share_via_slack_channel_action', {
                slackChannel: slackChannelToShareTo.name,
              })
            : t('share_via_slack_action')}
        </Button2>
      </BoxWithPopper2>
    </>
  );
}
