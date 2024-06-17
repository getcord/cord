import { useCallback, useMemo } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { CONNECT_SLACK_SUCCESS_TEXT } from 'common/const/Strings.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useConnectWithSlack } from 'external/src/effects/useConnectWithSlack.ts';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';

type ShareStatus =
  | 'can-share-thread'
  | 'thread-is-shared'
  | 'slack-not-connected';

type Props = {
  showSlackChannelSelectMenu: () => void;
  isSlackWorkspaceConnected?: boolean;
};

export const ShareToSlackMenuItem2 = ({
  showSlackChannelSelectMenu,
  isSlackWorkspaceConnected,
}: Props) => {
  const { t } = useCordTranslation('thread');
  const thread = useThreadData();

  const { hideThirdPartyAuthDataModal } =
    useContextThrowingIfNoProvider(EmbedContext);
  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;
  const { enableSlack } = useContextThrowingIfNoProvider(ConfigurationContext);

  const { location } = useContextThrowingIfNoProvider(ThreadsContext2);

  const onSuccess = useCallback(() => {
    hideThirdPartyAuthDataModal();

    return showToastPopup?.(CONNECT_SLACK_SUCCESS_TEXT);
  }, [hideThirdPartyAuthDataModal, showToastPopup]);

  const onError = useCallback(() => {
    hideThirdPartyAuthDataModal();
  }, [hideThirdPartyAuthDataModal]);

  const connectWithSlackFlow = useConnectWithSlack({ onSuccess, onError });

  const { logEvent } = useLogger();

  const handleClickConnectSlack = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();

      logEvent('click-thread-menu-connect-slack-prompt');
      connectWithSlackFlow();
    },
    [connectWithSlackFlow, logEvent],
  );

  const menuItem = useMemo(() => {
    let shareStatus: ShareStatus | null = null;

    if (!enableSlack || location === 'inbox') {
      return <></>;
    }

    if (isSlackWorkspaceConnected) {
      if (thread?.sharedToSlack) {
        shareStatus = 'thread-is-shared';
      } else {
        shareStatus = 'can-share-thread';
      }
    } else {
      shareStatus = 'slack-not-connected';
    }

    switch (shareStatus) {
      case 'thread-is-shared':
        return (
          <Link2
            newTab={true}
            href={thread?.sharedToSlack?.slackURL ?? undefined}
            linkStyle="primary"
            underline={false}
          >
            <MenuItem2
              label={t('share_via_slack_action_success', {
                slackChannel: thread?.sharedToSlack?.channel,
              })}
              leftItem={<Icon2 name="Slack" size="large" />}
              onClick={(event) => {
                event.stopPropagation();
                logEvent('click-thread-menu-shared-to-slack-link');
              }}
            />
          </Link2>
        );
      case 'can-share-thread':
        return (
          <MenuItem2
            label={t('share_via_slack_action')}
            leftItem={<Icon2 name="Slack" size="large" />}
            onClick={(event) => {
              event.stopPropagation();
              logEvent('click-thread-menu-share-to-slack');
              showSlackChannelSelectMenu();
            }}
          />
        );

      case 'slack-not-connected':
        return (
          <MenuItem2
            label={t('share_via_slack_action_not_connected')}
            leftItem={<Icon2 name="Slack" size="large" />}
            onClick={handleClickConnectSlack}
          />
        );
      default:
        return <></>;
    }
  }, [
    enableSlack,
    location,
    isSlackWorkspaceConnected,
    thread?.sharedToSlack,
    t,
    handleClickConnectSlack,
    logEvent,
    showSlackChannelSelectMenu,
  ]);

  return menuItem;
};
