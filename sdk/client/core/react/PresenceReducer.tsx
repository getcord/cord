import { useEffect, useMemo, useState } from 'react';

import type { PresenceReducerOptions } from '@cord-sdk/react';
import type { UserLocationData, ClientUserData } from '@cord-sdk/types';

import { useCordLocation } from 'sdk/client/core/react/useCordLocation.tsx';
import { CordSDK } from 'sdk/client/core/index.tsx';
import type { PresenceUser } from '@cord-sdk/react/common/lib/presence.ts';
import { getUsersAtLocation } from '@cord-sdk/react/common/lib/presence.ts';

type Props = Omit<PresenceReducerOptions, 'exactMatch'> & {
  children(users: Array<PresenceUser>): JSX.Element;
};

export default function PresenceReducer({
  context,
  location,
  partialMatch = true,
  excludeViewer = false,
  onlyPresentUsers = false,
  children,
}: Props) {
  const cordLocation = useCordLocation(location ?? context);
  const [presenceData, setPresenceData] = useState<UserLocationData[]>([]);
  const [userDataByUserID, setUserDataByUserID] = useState<
    Record<string, ClientUserData | null>
  >({});
  const [viewerID, setViewerID] = useState<string>();

  const sdk = CordSDK.get();

  useEffect(() => {
    const listenerRef = sdk.presence.observePresence(
      cordLocation,
      (data) => {
        setPresenceData(data);
      },
      {
        exclude_durable: onlyPresentUsers,
        partial_match: partialMatch,
        __cordInternal: true,
      },
    );
    return () => {
      sdk.presence.unobservePresence(listenerRef);
    };
  }, [sdk, cordLocation, partialMatch, onlyPresentUsers]);

  useEffect(() => {
    const listenerRef = sdk.user.observeUserData(
      presenceData.map((u) => u.id),
      (data) => {
        setUserDataByUserID(data);
      },
      {
        __cordInternal: true,
      },
    );
    return () => {
      sdk.user.unobserveUserData(listenerRef);
    };
  }, [sdk, presenceData]);

  useEffect(() => {
    const listenerRef = sdk.user.observeViewerData(
      (viewer) => setViewerID(viewer.id),
      {
        __cordInternal: true,
      },
    );
    return () => {
      sdk.user.unobserveViewerData(listenerRef);
    };
  }, [sdk]);

  const result = useMemo<PresenceUser[]>(() => {
    if (excludeViewer && viewerID === undefined) {
      // if we're supposed to exclude the viewer, then don't
      // return anything until we know who the viewer is
      return [];
    }

    return getUsersAtLocation({
      presenceData,
      excludeViewer,
      onlyPresentUsers,
      usersDataByUserID: userDataByUserID,
      viewerID,
    });
  }, [
    presenceData,
    userDataByUserID,
    viewerID,
    excludeViewer,
    onlyPresentUsers,
  ]);

  return children(result);
}
