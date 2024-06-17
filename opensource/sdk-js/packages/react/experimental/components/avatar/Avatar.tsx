import * as React from 'react';
import { forwardRef, useMemo, useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js';

import cx from 'classnames';

import type { ClientUserData } from '@cord-sdk/types';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import { cordifyClassname } from '../../../common/cordifyClassname.js';
import { getStableColorPalette } from '../../../common/util.js';
import classes from '../../../components/Avatar.css.js';
import { useViewerData, useUserData } from '../../../hooks/user.js';
import { AvatarFallback, AvatarTooltip } from '../../../betaV2.js';
import type {
  AvatarProps,
  ByID,
  CommonAvatarProps,
  WithByIDComponent,
} from '../../../betaV2.js';
import { WithTooltip } from '../WithTooltip.js';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';

function useImageStatus(
  imageRef: React.RefObject<HTMLImageElement>,
  imageUrl: string | null,
) {
  const getSnapshot = useCallback(() => {
    if (!imageUrl) {
      return 'error';
    }
    if (imageRef && imageRef.current) {
      if (imageRef.current.naturalWidth === 0 && imageRef.current.complete) {
        return 'error';
      }
      if (imageRef.current.complete) {
        return 'loaded';
      }
    }
    return 'loading';
  }, [imageRef, imageUrl]);

  const getServerSnapshot = useCallback(() => 'loaded', []);

  const subscribe = useCallback(
    (cb: () => void) => {
      if (imageRef?.current) {
        imageRef.current.addEventListener('load', cb);
        imageRef.current.addEventListener('error', cb);
      }
      return () => {
        if (imageRef?.current) {
          imageRef.current?.removeEventListener('load', cb);
          imageRef.current?.removeEventListener('error', cb);
        }
      };
    },
    // we do want subscribe to run when the url changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imageRef, imageUrl],
  );

  const status = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return status;
}

export const Avatar: WithByIDComponent<AvatarProps, AvatarByIDProps> =
  Object.assign(
    withCord<React.PropsWithChildren<AvatarProps>>(
      React.forwardRef(function Avatar(
        {
          user,
          enableTooltip = false,
          className,
          isAbsent,
          ...restProps
        }: AvatarProps,
        ref?: React.ForwardedRef<HTMLDivElement>,
      ) {
        const viewerData = useViewerData();
        const tooltip = useMemo(() => {
          if (!user || !viewerData) {
            return null;
          }
          return (
            <AvatarTooltip
              userData={user}
              viewerData={viewerData}
              canBeReplaced
            />
          );
        }, [user, viewerData]);

        if (!user) {
          return null;
        }
        return (
          <>
            {enableTooltip ? (
              <WithTooltip tooltip={tooltip}>
                <AvatarInner
                  ref={ref}
                  user={user}
                  className={className}
                  isAbsent={isAbsent}
                  {...restProps}
                />
              </WithTooltip>
            ) : (
              <AvatarInner
                ref={ref}
                user={user}
                className={className}
                isAbsent={isAbsent}
                {...restProps}
              />
            )}
          </>
        );
      }),
      'Avatar',
      { user: (props) => props.user?.id },
    ),
    { ByID: AvatarByID },
  );

export type AvatarInnerProps = {
  user: ClientUserData;
  isAbsent?: boolean;
} & MandatoryReplaceableProps;
type AvatarPropsWithClassname = AvatarInnerProps & { className?: string };

const AvatarInner = forwardRef(function AvatarImpl(
  { user, isAbsent, className, ...restProps }: AvatarPropsWithClassname,
  ref: React.Ref<HTMLDivElement>,
) {
  const { displayName, name, id, profilePictureURL } = user;
  const imageRef = useRef<HTMLImageElement>(null);
  const status = useImageStatus(imageRef, profilePictureURL);
  const avatarPalette = useMemo(() => getStableColorPalette(id), [id]);

  return (
    <div
      ref={ref}
      className={cx(classes.avatarContainer, className, {
        [MODIFIERS.present]: !isAbsent,
        [MODIFIERS.notPresent]: isAbsent,
        [MODIFIERS.loading]: status === 'loading',
        [`${cordifyClassname('color-palette')}-${avatarPalette}`]:
          status === 'error',
        [MODIFIERS.error]: status === 'error',
      })}
      data-cy="cord-avatar"
      data-cord-user-id={id}
      data-cord-user-name={name}
      {...restProps}
    >
      <img
        ref={imageRef}
        className={classes.avatarImage}
        draggable={false}
        alt={displayName}
        src={profilePictureURL!}
      />
      {status === 'error' && <AvatarFallback userData={user} canBeReplaced />}
    </div>
  );
});

export interface AvatarByIDProps extends CommonAvatarProps {
  userID: string;
}

function AvatarByID(props: ByID<AvatarByIDProps>) {
  const { userID, ...restProps } = props;
  const user = useUserData(userID);

  if (!user) {
    return null;
  }

  return <Avatar user={user} {...restProps} canBeReplaced />;
}
