import { useCordTranslation } from '@cord-sdk/react';
import { ShareToSlackMenuItem2 } from 'external/src/components/2/ShareToSlackMenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import type { UUID } from 'common/types/index.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';

type Props = {
  closeMenu: () => void;
  showSlackChannelSelectMenu: () => void;
  showShareToEmailMenu: () => void;
  threadID: UUID;
  markThreadAsRead?: (threadID: string) => void;
  isSlackWorkspaceConnected?: boolean;
};

export const ThreadActions = ({
  closeMenu,
  showSlackChannelSelectMenu,
  showShareToEmailMenu,
  threadID,
  markThreadAsRead,
  isSlackWorkspaceConnected,
}: Props) => {
  const { t } = useCordTranslation('thread');
  const { logEvent } = useLogger();
  const emailSharingEnabled = useFeatureFlag(FeatureFlags.EMAIL_SHARING);

  const thread = useThreadData()!;

  const { setSubscribed, setResolved } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { onThreadResolve } = useContextThrowingIfNoProvider(ThreadListContext);

  return (
    <>
      {!!markThreadAsRead && (
        <MenuItem2
          leftItem={<Icon2 name="Archive" size="large" />}
          label={t('mark_as_read_action')}
          onClick={(event) => {
            event.stopPropagation();
            logEvent('click-thread-menu-move-to-read');
            markThreadAsRead?.(threadID);
            closeMenu();
          }}
        />
      )}
      <ShareToSlackMenuItem2
        showSlackChannelSelectMenu={showSlackChannelSelectMenu}
        isSlackWorkspaceConnected={isSlackWorkspaceConnected}
      />
      {emailSharingEnabled && (
        <MenuItem2
          label={t('share_via_email_action')}
          leftItem={<Icon2 name="EnvelopeSimple" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            logEvent('click-thread-menu-share-to-email');
            showShareToEmailMenu();
          }}
        />
      )}
      <MenuItem2
        label={t(thread.subscribed ? 'unsubscribe_action' : 'subscribe_action')}
        leftItem={
          <Icon2 name={thread.subscribed ? 'BellSlash' : 'Bell'} size="large" />
        }
        onClick={(event) => {
          event.stopPropagation();
          logEvent('click-thread-menu-subscribed', {
            subscribed: thread.subscribed,
          });
          showToastPopup?.(
            t(
              thread.subscribed
                ? 'unsubscribe_action_success'
                : 'subscribe_action_success',
            ),
          );
          setSubscribed(threadID, !thread.subscribed);
          closeMenu();
        }}
      />
      {!thread.resolved && (
        <MenuItem2
          label={t('resolve_action')}
          leftItem={<Icon2 name="CheckCircle" size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            logEvent('click-thread-menu-resolve-thread');
            showToastPopup?.(t('resolve_action_success'));
            setResolved(threadID, true, true);
            onThreadResolve?.({
              threadID: thread.externalID ?? externalizeID(threadID),
              thread: getThreadSummary(thread, userByInternalID),
            });
            markThreadAsRead?.(threadID);
            closeMenu();
          }}
        />
      )}
    </>
  );
};
