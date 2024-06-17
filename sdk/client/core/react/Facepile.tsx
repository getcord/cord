import { useMemo } from 'react';
import { user } from '@cord-sdk/react';
import type { FacepileReactComponentProps } from '@cord-sdk/react';
import { Facepile as Facepile3 } from 'external/src/components/ui3/Facepile.tsx';
import { isDefined } from 'common/util/index.ts';

export function Facepile({
  users,
  enableTooltip = true,
}: FacepileReactComponentProps) {
  const userDataById = user.useUserData(users);
  const userData = useMemo(
    () => Object.values(userDataById).filter(isDefined),
    [userDataById],
  );
  if (!userData) {
    return null;
  }
  return (
    <Facepile3
      users={userData}
      showPresence={false}
      maxUsers={users.length}
      showExtraUsersNumber={false}
      enableTooltip={enableTooltip}
    />
  );
}
