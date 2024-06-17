// @ts-ignore TS wants us to `import type` this, but we need it for JSX
import * as React from 'react';
import { forwardRef } from 'react';
import type { Location } from '@cord-sdk/types';

import { PresenceObserver } from '../../components/PresenceObserver.js';
import type { StyleProps } from '../../betaV2.js';
import withCord from './hoc/withCord.js';
import { PresenceFacepile } from './PresenceFacepile.js';
import type { MandatoryReplaceableProps } from './replacements.js';

export type PagePresenceProps = {
  location: Location;
  numOfAvatars?: number;
  durable?: boolean;
  excludeViewer?: boolean;
  onlyPresentUsers?: boolean;
  groupID?: string;
} & StyleProps &
  MandatoryReplaceableProps;

export const PagePresence = withCord<
  React.PropsWithChildren<PagePresenceProps>
>(
  forwardRef(function PagePresence(
    {
      location,
      durable = true,
      excludeViewer,
      numOfAvatars,
      onlyPresentUsers,
      groupID,
      ...restProps
    }: PagePresenceProps,
    ref?: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <>
        <PresenceFacepile
          canBeReplaced
          location={location}
          excludeViewer={excludeViewer}
          onlyPresentUsers={onlyPresentUsers}
          numOfAvatars={numOfAvatars}
          ref={ref}
          {...restProps}
        />
        <PresenceObserver
          groupId={groupID}
          location={location}
          durable={durable}
          observeDocument
        />
      </>
    );
  }),
  'PagePresence',
);
