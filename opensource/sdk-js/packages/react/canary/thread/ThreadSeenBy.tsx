import * as React from 'react';
import { forwardRef, useCallback } from 'react';
import type { Ref } from 'react';

import cx from 'classnames';
import type { ClientMessageData, ThreadParticipant } from '@cord-sdk/types';
import {
  DefaultTooltip,
  WithTooltip,
} from '../../experimental/components/WithTooltip.js';
import { useViewerData } from '../../hooks/user.js';
import { useCordTranslation } from '../../hooks/useCordTranslation.js';
import { fontSmallLight } from '../../common/ui/atomicClasses/fonts.css.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import * as classes from './ThreadSeenBy.css.js';

const DEFAULT_NUM_OF_NAMES_TO_SHOW = 3; // After which we'll show "and X others";

const MAX_TOOLTIP_NAMES_TO_SHOW = 30;

export const ThreadSeenByWrapper = forwardRef(function ThreadSeenByWrapper(
  {
    message,
    participants,
  }: {
    message: ClientMessageData | null | undefined;
    participants: ThreadParticipant[];
  },
  ref: Ref<HTMLElement>,
) {
  const { t } = useCordTranslation('message');
  const { t: userT } = useCordTranslation('user');

  const viewerData = useViewerData();
  const getSeenByDisplayLabel = useCallback(
    (
      allUsersWhoSawMessage: ThreadParticipant[],
      numOfNamesToShow: number = DEFAULT_NUM_OF_NAMES_TO_SHOW,
    ) => {
      if (allUsersWhoSawMessage.length <= 0) {
        return null;
      }

      const namesOfActiveUsersWhoSaw: string[] = [];
      allUsersWhoSawMessage.forEach((user) => {
        if (viewerData?.id !== user.userID) {
          if (!user.displayName) {
            return;
          }
          namesOfActiveUsersWhoSaw.push(userT('other_user', { user }));
        }
      });

      if (namesOfActiveUsersWhoSaw.length === 0) {
        return null;
      }
      if (numOfNamesToShow < namesOfActiveUsersWhoSaw.length) {
        const numOfOtherUsers =
          namesOfActiveUsersWhoSaw.length - numOfNamesToShow;
        return t('seen_by_status_overflow', {
          users: namesOfActiveUsersWhoSaw.slice(0, numOfNamesToShow),
          count: numOfOtherUsers,
        });
      } else {
        return t('seen_by_status', { users: namesOfActiveUsersWhoSaw });
      }
    },
    [t, userT, viewerData?.id],
  );

  if (!viewerData || message?.type !== 'user_message') {
    return null;
  }

  const allUsersWhoSawMessage = getAllUsersWhoSawMessage(message, participants);

  return (
    <ThreadSeenBy
      ref={ref}
      canBeReplaced
      viewers={allUsersWhoSawMessage}
      message={message}
      getSeenByDisplayLabel={getSeenByDisplayLabel}
    />
  );
});

export type ThreadSeenByProps = {
  viewers: ThreadParticipant[];
  message: ClientMessageData;
  getSeenByDisplayLabel: (
    users: ThreadParticipant[],
    numOfNamesToShow?: number,
  ) => string | null;
} & StyleProps &
  MandatoryReplaceableProps;

export const ThreadSeenBy = withCord<
  React.PropsWithChildren<ThreadSeenByProps>
>(
  forwardRef(function ThreadSeenBy(
    props: ThreadSeenByProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      viewers,
      className,
      getSeenByDisplayLabel,
      message: _message,
      ...otherProps
    } = props;

    const truncatedSeenBy = getSeenByDisplayLabel(viewers);

    if (!truncatedSeenBy) {
      return null;
    }

    const tooltip =
      viewers.length > DEFAULT_NUM_OF_NAMES_TO_SHOW
        ? getSeenByDisplayLabel(
            viewers,
            viewers.length > MAX_TOOLTIP_NAMES_TO_SHOW
              ? MAX_TOOLTIP_NAMES_TO_SHOW
              : viewers.length,
          )
        : null;

    if (tooltip) {
      return (
        <WithTooltip tooltip={<DefaultTooltip label={tooltip} />}>
          <div
            className={cx(className, classes.threadSeenBy, fontSmallLight)}
            ref={ref}
            {...otherProps}
          >
            {truncatedSeenBy}
          </div>
        </WithTooltip>
      );
    }
    return (
      <div
        className={cx(className, classes.threadSeenBy, fontSmallLight)}
        ref={ref}
        {...otherProps}
      >
        {truncatedSeenBy}
      </div>
    );
  }),
  'ThreadSeenBy',
);

function getAllUsersWhoSawMessage(
  message: ClientMessageData,
  participants: ThreadParticipant[],
) {
  return (
    participants?.filter(
      (participant) =>
        participant.userID !== message.authorID &&
        participant.lastSeenTimestamp &&
        new Date(message.createdTimestamp).getTime() <=
          new Date(participant.lastSeenTimestamp).getTime(),
    ) ?? []
  );
}
