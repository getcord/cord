import { memo, useMemo } from 'react';
import type { ClientUserData, UserLocationData } from '@cord-sdk/types';
import { presence, user } from '@cord-sdk/react';
import type { PresenceFacepileReactComponentProps } from '@cord-sdk/react';

import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { PresenceFacepileCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { getUsersAtLocation } from '@cord-sdk/react/common/lib/presence.ts';

const DEFAULT_MAX_USERS = 5;

function PresenceFacepile(props: PresenceFacepileReactComponentProps) {
  return (
    <CSSVariableOverrideContext.Provider value={PresenceFacepileCSSOverrides}>
      <PresenceFacepileImpl {...props} />
    </CSSVariableOverrideContext.Provider>
  );
}

export function PresenceFacepileImpl({
  context,
  location,
  excludeViewer = false,
  orientation = 'horizontal',
  onlyPresentUsers = false,
  exactMatch = false,
  partialMatch = true,
  maxUsers = DEFAULT_MAX_USERS,
}: PresenceFacepileReactComponentProps) {
  const viewer = user.useViewerData();
  const presenceData = presence.usePresence(
    location ?? context ?? { location: window.location.href },
    { partial_match: partialMatch && !exactMatch },
  );
  const usersDataByUserID = user.useUserData(
    presenceData?.map((u) => u.id) ?? [],
  );
  const users = useFacepileUsers({
    excludeViewer,
    onlyPresentUsers,
    presenceData: presenceData ?? [],
    usersDataByUserID,
    viewerID: viewer?.id,
  });

  return (
    <PagePresenceAndVisitorsShim
      location={location ?? context}
      // We want to disable partialMatch if either partialMatch or exactMatch is
      // set to the non-default value
      partialMatch={partialMatch && !exactMatch}
      excludeViewer={excludeViewer}
      onlyPresentUsers={onlyPresentUsers}
    >
      <Facepile2
        users={users}
        maxUsers={maxUsers}
        showPresence={true}
        orientation={orientation}
      />
    </PagePresenceAndVisitorsShim>
  );
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
      .map(({ user: cordUser }) => cordUser);
  }, [
    excludeViewer,
    onlyPresentUsers,
    presenceData,
    usersDataByUserID,
    viewerID,
  ]);
}

// TODO: make this automatic
export default memo(PresenceFacepile);
