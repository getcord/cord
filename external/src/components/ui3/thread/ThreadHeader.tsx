import { useCallback } from 'react';

import type { ThreadCallbackInfoWithThreadID } from '@cord-sdk/types';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';

import * as classes from 'external/src/components/ui3/thread/ThreadHeader.css.ts';
import { OptionsMenu } from 'external/src/components/ui3/OptionsMenu.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function ThreadHeader({
  threadId,
  thread,
  onClose,
  showContextMenu = true,
}: {
  threadId: string;
  thread?: ThreadData;
  onClose?: (arg: ThreadCallbackInfoWithThreadID) => unknown;
  showContextMenu?: boolean;
}) {
  const { logEvent } = useLogger();
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const onClickClose = useCallback(() => {
    logEvent('click-thread-header-close-thread');

    const threadInfo = thread
      ? getThreadSummary(thread, userByInternalID)
      : null;

    onClose?.({ threadID: threadId, thread: threadInfo });
  }, [logEvent, onClose, thread, threadId, userByInternalID]);

  return (
    <div className={classes.threadHeader}>
      {showContextMenu && (
        <OptionsMenu
          threadID={threadId}
          button={
            <Button
              buttonAction="open-thread-menu"
              buttonType="secondary"
              icon="DotsThree"
              size="small"
            />
          }
          showThreadOptions={true}
          showMessageOptions={false}
        />
      )}
      <Button
        buttonAction="close-thread"
        buttonType="secondary"
        icon="X"
        onClick={onClickClose}
        size="small"
      />
    </div>
  );
}

export const newThreadHeaderConfig = {
  NewComp: ThreadHeader,
  configKey: 'threadHeader',
} as const;
