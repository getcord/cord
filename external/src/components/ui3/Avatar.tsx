import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';

import classes from 'external/src/components/ui3/Avatar.css.ts';
import { fontSmall, fontBody } from 'common/ui/atomicClasses/fonts.css.ts';
import type { AvatarProps } from 'external/src/components/ui2/Avatar2.tsx';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { getStableColorPalette } from 'common/ui/getStableColorPalette.ts';
import { cordifyClassname } from 'common/ui/style.ts';

type AvatarPropsWithClassnme = AvatarProps & { className?: string };

export const Avatar = forwardRef(function Avatar(
  {
    user: { displayName, name, id, profilePictureURL },
    translucent,
    size,
    className,
    additionalClassName,
    ...restProps
  }: AvatarPropsWithClassnme,
  ref: React.Ref<HTMLDivElement>,
) {
  // TODO improve old props: translucent -> isPresent.
  const isPresent = !translucent;
  const [imageStatus, setImageStatus] = useState<
    'loading' | 'loaded' | 'error'
  >(() => {
    if (!profilePictureURL) {
      return 'error';
    }
    return 'loading';
  });

  const mountedRef = useRef(false);
  useEffect(() => {
    // Run this effect when profile picture url changes but not on mount
    if (mountedRef.current) {
      setImageStatus('loading');
    } else {
      mountedRef.current = true;
    }
  }, [profilePictureURL]);

  const avatarPalette = useMemo(() => getStableColorPalette(id), [id]);

  return imageStatus !== 'error' ? (
    <div
      {...restProps}
      ref={ref}
      className={cx(classes.avatarContainer, className, additionalClassName, {
        [MODIFIERS.present]: isPresent,
        [MODIFIERS.notPresent]: isPresent === false,
        [MODIFIERS.loading]: imageStatus === 'loading',
      })}
      data-cy="cord-avatar"
      data-cord-user-id={id}
      data-cord-user-full-name={name}
    >
      <img
        className={classes.avatarImage}
        draggable={false}
        alt={displayName}
        onError={() => setImageStatus('error')}
        onLoad={() => setImageStatus('loaded')}
        src={profilePictureURL!}
      />
    </div>
  ) : (
    <div
      className={cx(
        classes.avatarContainer,
        className,
        additionalClassName,
        [`${cordifyClassname('color-palette')}-${avatarPalette}`],
        {
          [MODIFIERS.present]: isPresent,
          [MODIFIERS.notPresent]: isPresent === false,
        },
      )}
      {...restProps}
      ref={ref}
      data-cord-user-id={id}
      data-cord-user-full-name={name}
    >
      <div
        className={cx(classes.avatarFallback, {
          [fontSmall]: size === 'm',
          [fontBody]: size !== 'm',
        })}
      >
        {displayName[0].toUpperCase()}
      </div>
    </div>
  );
});

export const newAvatarConfig = {
  NewComp: Avatar,
  configKey: 'avatar',
} as const;
