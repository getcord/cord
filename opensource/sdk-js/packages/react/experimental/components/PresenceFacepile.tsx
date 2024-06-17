import * as React from 'react';
import { useMemo, forwardRef } from 'react';
import cx from 'classnames';
import type { UserLocationData, ClientUserData } from '@cord-sdk/types';
import { useUserData, useViewerData } from '../../hooks/user.js';
import { useCordTranslation } from '../../hooks/useCordTranslation.js';
import type { PresenceReducerOptions } from '../../types.js';
import { usePresence } from '../../hooks/presence.js';
import { getUsersAtLocation } from '../../common/lib/presence.js';
import { useTime } from '../../common/effects/useTime.js';
import { relativeTimestampString } from '../../common/util.js';
import classes from '../../components/Facepile.css.js';
import type { StyleProps } from '../../betaV2.js';
import { DefaultTooltip, WithTooltip } from './WithTooltip.js';
import { Avatar } from './avatar/Avatar.js';
import withCord from './hoc/withCord.js';
import type { MandatoryReplaceableProps } from './replacements.js';

const DEFAULT_NUM_OF_AVATARS = 5;

export type PresenceFacepileProps = PresenceReducerOptions & {
  /**
   * If 100 users visited the page, we'll likely only want to show ~5 avatars.
   * The rest of users will be added to the count ("+<Number of users>") appended
   * at the end of the PresenceFacepile.
   */
  numOfAvatars?: number;
} & StyleProps &
  MandatoryReplaceableProps;

/**
 * Display all users at a particular location.
 */
export const PresenceFacepile = withCord<
  React.PropsWithChildren<PresenceFacepileProps>
>(
  forwardRef(function PresenceFacepile(
    {
      className,
      location,
      excludeViewer = false,
      onlyPresentUsers = false,
      partialMatch = true,
      numOfAvatars = DEFAULT_NUM_OF_AVATARS,
      ...restProps
    }: PresenceFacepileProps,
    ref?: React.ForwardedRef<HTMLDivElement>,
  ) {
    const viewer = useViewerData();
    const presenceData = usePresence(
      location ?? { location: window.location.href },
      { partial_match: partialMatch },
    );
    const usersDataByUserID = useUserData(presenceData?.map((u) => u.id) ?? []);
    const users = useFacepileUsers({
      excludeViewer,
      onlyPresentUsers,
      presenceData: presenceData ?? [],
      usersDataByUserID,
      viewerID: viewer?.id,
    });

    const [visibleUsers, extraUsers] = useMemo(
      () => [users.slice(0, numOfAvatars), users.slice(numOfAvatars)],
      [numOfAvatars, users],
    );

    return (
      <div
        className={cx(classes.facepileContainer, className)}
        ref={ref}
        {...restProps}
      >
        {visibleUsers.map(({ user, isPresent, lastPresentTime }) => (
          <WithTooltip
            tooltip={
              <PresenceTooltip
                isViewer={viewer?.id === user.id}
                isPresent={isPresent}
                lastPresentTime={lastPresentTime}
                user={user}
              />
            }
            key={user.id}
          >
            <Avatar user={user} isAbsent={!isPresent} canBeReplaced />
          </WithTooltip>
        ))}

        {extraUsers.length > 0 && (
          <WithTooltip
            tooltip={<PresenceExtraUsersTooltip extraUsers={extraUsers} />}
          >
            <div className={classes.otherUsers}>{`+${extraUsers.length}`}</div>
          </WithTooltip>
        )}
      </div>
    );
  }),
  'PresenceFacepile',
);

type PresenceTooltipProps = {
  user: ClientUserData;
  isViewer: boolean;
  isPresent: boolean;
  lastPresentTime: number | null;
};
function PresenceTooltip({
  isViewer,
  isPresent,
  lastPresentTime,
  user,
}: PresenceTooltipProps) {
  const { t } = useCordTranslation('user');
  const { t: presenceT } = useCordTranslation('presence');
  const { t: relativeT } = useCordTranslation('presence', {
    keyPrefix: 'timestamp',
  });
  const time = useTime();

  return (
    <DefaultTooltip
      label={isViewer ? t('viewer_user', { user }) : t('other_user', { user })}
      subtitle={
        isPresent
          ? presenceT('viewing')
          : lastPresentTime
          ? relativeTimestampString(new Date(lastPresentTime), time, relativeT)
          : undefined
      }
    ></DefaultTooltip>
  );
}

type PresenceExtraUsersTooltipProps = {
  extraUsers: ReturnType<typeof useFacepileUsers>;
};
function PresenceExtraUsersTooltip({
  extraUsers,
}: PresenceExtraUsersTooltipProps) {
  const extraUsersTooltipText = useMemo(
    () => extraUsers.map(({ user }) => user.displayName).join(', '),
    [extraUsers],
  );

  return <DefaultTooltip label={extraUsersTooltipText} />;
}

/**
 * Returns a sorted list of users, where currently active
 * are first, followed by most recently active.
 */
function useFacepileUsers({
  excludeViewer,
  onlyPresentUsers,
  presenceData,
  usersDataByUserID,
  viewerID,
}: {
  excludeViewer: boolean;
  onlyPresentUsers: boolean;
  presenceData: UserLocationData[];
  usersDataByUserID: Record<string, ClientUserData | null>;
  viewerID: string | undefined;
}) {
  return useMemo(() => {
    if (excludeViewer && viewerID === undefined) {
      // if we're supposed to exclude the viewer, then don't
      // return anything until we know who the viewer is
      return [];
    }

    // All users who are, or have been at this location.
    const usersAtLocation = getUsersAtLocation({
      presenceData,
      excludeViewer,
      onlyPresentUsers,
      usersDataByUserID,
      viewerID,
    });

    return usersAtLocation
      .sort(
        (
          { user: user1, present: present1, lastPresentTime: lastPresentTime1 },
          { user: user2, present: present2, lastPresentTime: lastPresentTime2 },
        ) => {
          if (present1 && present2) {
            // order by userID so it's consistent
            return user1.id < user2.id ? -1 : 1;
          }

          // Present users should come first.
          if (present1 && !present2) {
            return -1;
          }
          if (present2 && !present1) {
            return 1;
          }

          // If the users are not currently on the page,
          // sort by most recently active on the page.
          if (lastPresentTime1 && lastPresentTime2) {
            return lastPresentTime2 - lastPresentTime1;
          }

          // We should never reach this point, but do nothing in this case.
          return 0;
        },
      )
      .map(({ user, lastPresentTime, present }) => ({
        user,
        isPresent: present,
        lastPresentTime,
      }));
  }, [
    excludeViewer,
    onlyPresentUsers,
    presenceData,
    usersDataByUserID,
    viewerID,
  ]);
}
