import * as React from 'react';
import { useMemo } from 'react';

import type { ClientMessageData } from '@cord-sdk/types';
import { useThread } from '../../../hooks/thread.js';
import { useCordTranslation } from '../../../hooks/useCordTranslation.js';
import { Icon } from '../../../components/helpers/Icon.js';
import { useToast } from '../../hooks/useToast.js';
import { useViewerData } from '../../../hooks/user.js';
import { setResolved, setSubscribed } from '../../../common/lib/thread.js';
import type { MenuProps } from './Menu.js';
import { MenuItem } from './MenuItem.js';
import type { MenuTypes } from './OptionsMenu.js';

export type ThreadActionsProps = {
  closeMenu: () => void;
  threadID: string;
  markThreadAsRead?: (threadID: string) => void;
  setMenuToShow: (menu: MenuTypes) => void;
  message?: ClientMessageData;
};

export const useThreadActions = ({
  closeMenu,
  threadID,
  markThreadAsRead,
  setMenuToShow,
  message,
}: ThreadActionsProps) => {
  const { t } = useCordTranslation('thread');

  const { thread } = useThread(threadID, { skip: !threadID });
  const user = useViewerData();

  const { showToastPopup } = useToast();
  return useMemo(() => {
    const items: MenuProps['items'] = [];
    if (!thread || !user) {
      return items;
    }
    const subscribed = thread.subscribers.includes(user.id);
    items.push({
      element: (
        <MenuItem
          canBeReplaced
          menuItemAction={'share_via_email_action'}
          label={t('share_via_email_action')}
          leftItem={<Icon name={'EnvelopeSimple'} size="large" />}
          onClick={(event) => {
            event.stopPropagation();
            setMenuToShow('shareToEmailForm');
          }}
        />
      ),
      name: 'share-via-email',
    });

    if (markThreadAsRead) {
      items.push({
        element: (
          <MenuItem
            canBeReplaced
            menuItemAction={'thread-mark-as-read'}
            leftItem={<Icon name="Archive" size="large" />}
            label={t('mark_as_read_action')}
            onClick={(event) => {
              event.stopPropagation();
              markThreadAsRead?.(threadID);
              closeMenu();
            }}
          />
        ),
        name: 'thread-mark-as-read',
      });
    }
    items.push({
      element: (
        <MenuItem
          canBeReplaced
          menuItemAction={
            subscribed ? 'thread-unsubscribe' : 'thread-subscribe'
          }
          label={t(subscribed ? 'unsubscribe_action' : 'subscribe_action')}
          leftItem={
            <Icon name={subscribed ? 'BellSlash' : 'Bell'} size="large" />
          }
          onClick={(event) => {
            event.stopPropagation();
            showToastPopup?.(
              subscribed
                ? 'unsubscribe_action_success'
                : 'subscribe_action_success',
              t(
                subscribed
                  ? 'unsubscribe_action_success'
                  : 'subscribe_action_success',
              ),
              'success',
            );
            void setSubscribed(threadID, !subscribed);
            closeMenu();
          }}
        />
      ),
      name: 'thread-subscribe',
    });

    if (!thread.resolved) {
      items.push({
        element: (
          <MenuItem
            canBeReplaced
            menuItemAction={'thread-resolve'}
            label={t('resolve_action')}
            leftItem={<Icon name="CheckCircle" size="large" />}
            onClick={(event) => {
              event.stopPropagation();
              const toastID = 'resolve_action_success';
              showToastPopup?.(toastID, t(toastID), 'success');
              void setResolved(threadID, true);
              markThreadAsRead?.(threadID);
              closeMenu();
            }}
          />
        ),
        name: 'thread-resolve',
      });
      // Show a reopen button if the thread is resolved, unless the user is the
      // message author -- in that case the reopen button is in the message options.
    } else if (thread.resolved && message?.authorID !== user.id) {
      items.push({
        element: (
          <MenuItem
            canBeReplaced
            menuItemAction={'thread-unresolve'}
            label={t('unresolve_action')}
            leftItem={<Icon name="ArrowUDownLeft" size="large" />}
            onClick={(event) => {
              event.stopPropagation();
              const toastID = 'unresolve_action_success';
              showToastPopup?.(toastID, t(toastID), 'success');
              void setResolved(threadID, false);
              markThreadAsRead?.(threadID);
              closeMenu();
            }}
          />
        ),
        name: 'thread-resolve',
      });
    }

    return items;
  }, [
    closeMenu,
    markThreadAsRead,
    message?.authorID,
    setMenuToShow,
    showToastPopup,
    t,
    thread,
    threadID,
    user,
  ]);
};
