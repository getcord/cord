import { memo, useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';
import type { StyleProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';
import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newAvatarConfig } from 'external/src/components/ui3/Avatar.tsx';

export type AvatarComponentOverrides = Partial<{
  avatarSize: CSSVariable;
}>;

const useStyles = createUseStyles({
  avatarTranslucent: {
    opacity: 0.5,
  },
  avatarCommon: {
    borderRadius: cssVar('avatar-border-radius'),
  },
  avatarImage: {
    display: 'block',
    objectFit: 'cover',
  },
  avatarInitial: {
    alignItems: 'center',
    backgroundColor: cssVar('avatar-background-color'),
    color: cssVar('avatar-text-color'),
    cursor: 'default',
    display: 'flex',
    justifyContent: 'center',
  },
  avatarText: {
    transform: cssVar('avatar-text-transform'),
  },
  hidden: {
    visibility: 'hidden',
  },
  fontSize2xl: {
    fontSize: cssVar('space-2xl'),
  },
  fontSizeL: {
    fontSize: cssVar('space-l'),
  },
  fontSizeXs: {
    fontSize: `${addSpaceVars('4xs', '2xs')}`,
  },
});

export type AvatarProps = {
  user: ClientUserData;
  size?: 'l' | 'm' | 'xl' | '3xl' | '4xl';
  translucent?: boolean;
  additionalClassName?: string;
} & StyleProps<'marginPadding'>;

/**
 * @deprecated please use ui3/Avatar
 */
export const Avatar2 = memo(
  withNewCSSComponentMaybe(
    newAvatarConfig,
    function Avatar2({
      user,
      size = 'l',
      translucent = false,
      additionalClassName,
      ...styleProps
    }: AvatarProps) {
      const classes = useStyles();
      const { className } = useStyleProps(styleProps);
      const cssOverrideContext = useContextThrowingIfNoProvider(
        CSSVariableOverrideContext,
      );

      const [imageStatus, setImageStatus] = useState<
        'loading' | 'loaded' | 'error'
      >(() => {
        if (!user.profilePictureURL) {
          return 'error';
        }
        return 'loading';
      });

      const { className: sizeClassName } = useStyleProps({
        width: size,
        height: size,
        cssVariablesOverride: {
          width: cssOverrideContext.avatar?.avatarSize,
          height: cssOverrideContext.avatar?.avatarSize,
        },
      });

      const mountedRef = useRef(false);

      useEffect(() => {
        // Run this effect when profile picture url changes but not on mount
        if (mountedRef.current) {
          setImageStatus('loading');
        } else {
          mountedRef.current = true;
        }
      }, [user.profilePictureURL]);

      const name = user.displayName;

      return (
        <Box2
          className={cx(className, classes.avatarCommon, {
            [classes.avatarTranslucent]: translucent,
            [classes.hidden]: imageStatus === 'loading',
          })}
          data-cord-user-id={user.id}
        >
          {imageStatus !== 'error' ? (
            <img
              draggable={false}
              alt={name}
              className={cx(
                classes.avatarCommon,
                classes.avatarImage,
                sizeClassName,
                additionalClassName,
              )}
              onError={() => setImageStatus('error')}
              onLoad={() => setImageStatus('loaded')}
              src={user.profilePictureURL!}
              part={'profile-picture'}
            />
          ) : (
            <div
              className={cx(
                classes.avatarCommon,
                classes.avatarInitial,
                sizeClassName,
                additionalClassName,
              )}
              part={'profile-picture'}
            >
              <Text2
                className={cx(classes.avatarText, {
                  [classes.fontSize2xl]: size === '4xl',
                  [classes.fontSizeL]: size === 'xl',
                  [classes.fontSizeXs]: size === 'l',
                })}
                font={size === 'm' ? 'small' : 'body'}
                center={true}
                color="inherit"
              >
                {name[0].toUpperCase()}
              </Text2>
            </div>
          )}
        </Box2>
      );
    },
  ),
);
