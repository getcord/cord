import { memo, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import type { StyleProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { AvatarWithPresence2 } from 'external/src/components/ui2/AvatarWithPresence2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { NOT_GREYABLE_CLASS_NAME } from 'common/const/Styles.ts';
import type { ClientUserData, Orientation } from '@cord-sdk/types';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newFacepileConfig } from 'external/src/components/ui3/Facepile.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';

export const DEFAULT_NUM_OF_EXTRA_USER_NAMES = 5;

const useStyles = createUseStyles({
  facepileContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    zIndex: 0,
    position: 'relative', // z-index only functions on positioned elements
  },
  facepileContainerVertical: {
    flexDirection: 'column',
  },
  facepileHorizontal: {
    borderRight: `${cssVar('facepile-avatar-border-width')} solid ${cssVar(
      'facepile-background-color',
    )}`,

    '&:not(:first-child)': {
      marginLeft: `calc(${cssVar('facepile-avatar-overlap')} * -1)`,
    },

    '&:last-child': {
      borderRight: 'none',
    },
  },
  facepileVertical: {
    borderBottom: `${cssVar('facepile-avatar-border-width')} solid ${cssVar(
      'facepile-background-color',
    )}`,

    '&:not(:first-child)': {
      marginTop: `calc(${cssVar('facepile-avatar-overlap')} * -1)`,
    },

    '&:last-child': {
      borderBottom: 'none',
    },
  },
  facepileAvatarContainer: {
    borderRadius: cssVar('avatar-border-radius'),
    backgroundColor: cssVar('facepile-background-color'),
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  extraUsersText: {
    alignItems: 'center',
    cursor: 'default',
    display: 'flex',
  },
  extraUsersPlus: {
    lineHeight: '100%',
    // To vertically center
    marginTop: -1,
    paddingLeft: cssVar('facepile-avatar-overlap'),
  },
  extraUsersPlusOnly: {
    alignItems: 'center',
    borderRadius: cssVar('avatar-border-radius'),
    display: 'flex',
    marginLeft: `calc(${cssVar('facepile-avatar-overlap')} * -1)`,
    position: 'relative',
    paddingLeft: `calc(${cssVar('space-4xs')}/2)`,
    zIndex: 0,
  },
});

export type FacepileProps = {
  users: ClientUserData[]; // NB users must be pre-sorted into the correct presence order
  size?: 'l' | 'm' | 'xl';
  maxUsers?: number;
  showPresence?: boolean;
  orientation?: Orientation;
  showExtraUsersNumber?: boolean;
  numOfExtraUserNames?: number;
  className?: string;
  otherUsersTextClassName?: string;
  enableTooltip?: boolean;
} & StyleProps<'marginPadding'>;

export const Facepile2 = withNewCSSComponentMaybe(
  newFacepileConfig,
  memo(function Facepile2({
    users,
    size = 'l',
    maxUsers = 4,
    showPresence = true,
    showExtraUsersNumber = true,
    numOfExtraUserNames = DEFAULT_NUM_OF_EXTRA_USER_NAMES,
    orientation = 'horizontal',
    otherUsersTextClassName,
    enableTooltip = true,
    ...styleProps
  }: FacepileProps) {
    const { t } = useCordTranslation('user');
    const { user: viewer } = useContextThrowingIfNoProvider(IdentityContext);
    const classes = useStyles();
    const { className } = useStyleProps(styleProps);

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
        : `${concattedNames} and ${
            extraUsers.length - numOfExtraUserNames
          } more`;
    }, [extraUsers, numOfExtraUserNames, enableTooltip]);

    const extraUsersPlusWithNumberElement = (
      <Text2
        font="small"
        color="content-primary"
        colorHover="content-emphasis"
        part="presence-extra-users-label"
        className={cx(classes.extraUsersText, otherUsersTextClassName)}
        // height should be same height as avatar size to ensure tooltips align
        style={{ minHeight: cssVar(`space-${size}`) }}
      >{`+${extraUsers.length}`}</Text2>
    );
    const extraUsersPlusElement = (
      <Text2
        color="base"
        font={size === 'l' ? 'body' : 'small'}
        className={cx(classes.extraUsersPlus, NOT_GREYABLE_CLASS_NAME)}
      >
        +
      </Text2>
    );

    return (
      <Box2
        className={cx(className, classes.facepileContainer, {
          [classes.facepileContainerVertical]: orientation === 'vertical',
        })}
      >
        {visibleUsers.map((user, index) => (
          <Box2
            key={user.id}
            style={{ zIndex: visibleUsers.length - index }}
            className={cx(classes.facepileAvatarContainer, {
              [classes.facepileVertical]: orientation === 'vertical',
              [classes.facepileHorizontal]: orientation === 'horizontal',
            })}
          >
            {showPresence ? (
              <AvatarWithPresence2 user={user} size={size} />
            ) : (
              <>
                {enableTooltip ? (
                  <WithTooltip2
                    label={t(
                      viewer.id === user.id ? 'viewer_user' : 'other_user',
                      {
                        user,
                      },
                    )}
                    nowrap={true}
                  >
                    <Avatar2 user={user} size={size} />
                  </WithTooltip2>
                ) : (
                  <Avatar2 user={user} size={size} />
                )}
              </>
            )}
          </Box2>
        ))}

        {extraUsers.length > 0 &&
          (showExtraUsersNumber ? (
            <>
              {enableTooltip ? (
                <WithTooltip2
                  label={extraUsersTooltipText}
                  style={{ zIndex: visibleUsers.length }}
                  className={cx({
                    [classes.facepileAvatarContainer]: !showExtraUsersNumber,
                    [classes.facepileVertical]:
                      !showExtraUsersNumber && orientation === 'vertical',
                    [classes.facepileHorizontal]:
                      !showExtraUsersNumber && orientation === 'horizontal',
                  })}
                >
                  {extraUsersPlusWithNumberElement}
                </WithTooltip2>
              ) : (
                { extraUsersPlusWithNumberElement }
              )}
            </>
          ) : (
            <>
              {enableTooltip ? (
                <WithTooltip2
                  label={extraUsersTooltipText}
                  className={classes.extraUsersPlusOnly}
                  backgroundColor="content-emphasis"
                  borderRadius="medium"
                  height={size}
                  width={size}
                >
                  {extraUsersPlusElement}
                </WithTooltip2>
              ) : (
                { extraUsersPlusElement }
              )}
            </>
          ))}
      </Box2>
    );
  }),
);
