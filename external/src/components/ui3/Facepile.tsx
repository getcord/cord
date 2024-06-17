import { Fragment, useMemo } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import { useViewerData } from '@cord-sdk/react/hooks/user.ts';

import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import { AvatarWithPresence } from 'external/src/components/ui3/AvatarWithPresence.tsx';
import { NOT_GREYABLE_CLASS_NAME } from 'common/const/Styles.ts';
import { DEFAULT_NUM_OF_EXTRA_USER_NAMES } from 'external/src/components/ui2/Facepile2.tsx';
import type { FacepileProps } from 'external/src/components/ui2/Facepile2.tsx';
import classes from 'external/src/components/ui3/Facepile.css.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';

import { fontBody, fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

export const Facepile = ({
  users,
  size = 'l',
  maxUsers = 4,
  showPresence = true,
  showExtraUsersNumber = true,
  numOfExtraUserNames = DEFAULT_NUM_OF_EXTRA_USER_NAMES,
  // TODO: Should the new avatar implement this prop?
  orientation: _ = 'horizontal',
  otherUsersTextClassName,
  enableTooltip = false,
}: FacepileProps) => {
  const { t } = useCordTranslation('user');
  const viewerData = useViewerData();
  const visibleUsers = useMemo(
    () => users.slice(0, maxUsers),
    [users, maxUsers],
  );
  const extraUsers = useMemo(() => users.slice(maxUsers), [users, maxUsers]);

  const extraUsersTooltipText = useMemo(() => {
    if (!enableTooltip) {
      return null;
    }

    const concattedNames = extraUsers
      .map((user) => user.displayName)
      .slice(0, numOfExtraUserNames)
      .join(', ');

    return extraUsers.length <= numOfExtraUserNames
      ? concattedNames
      : `${concattedNames} and ${extraUsers.length - numOfExtraUserNames} more`;
  }, [extraUsers, numOfExtraUserNames, enableTooltip]);

  return (
    <div className={classes.facepileContainer}>
      {visibleUsers.map((user) => (
        <Fragment key={user.id}>
          {showPresence ? (
            <AvatarWithPresence user={user} size={size} />
          ) : enableTooltip ? (
            <WithTooltip
              label={t(
                viewerData?.id === user.id ? 'viewer_user' : 'other_user',
                {
                  user,
                },
              )}
            >
              <Avatar user={user} size={size} />
            </WithTooltip>
          ) : (
            <Avatar user={user} size={size} />
          )}
        </Fragment>
      ))}

      {extraUsers.length > 0 &&
        (showExtraUsersNumber ? (
          <WithTooltip label={extraUsersTooltipText}>
            <div
              className={cx(
                classes.otherUsers,
                fontSmall,
                otherUsersTextClassName,
              )}
            >{`+${extraUsers.length}`}</div>
          </WithTooltip>
        ) : (
          <WithTooltip label={extraUsersTooltipText}>
            <div
              className={cx(classes.otherUsersPlaceholder, {
                [MODIFIERS.extraLarge]: size === 'xl',
                [MODIFIERS.large]: size === 'l',
                [MODIFIERS.medium]: size === 'm',
                [fontBody]: size === 'l',
                [fontSmall]: size !== 'l',
                NOT_GREYABLE_CLASS_NAME,
              })}
            >
              +
            </div>
          </WithTooltip>
        ))}
    </div>
  );
};

export const newFacepileConfig = {
  NewComp: Facepile,
  configKey: 'facepile',
} as const;
