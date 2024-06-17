import { useMemo } from 'react';
import { useViewerData } from '@cord-sdk/react/hooks/user.ts';

import type { UUID } from 'common/types/index.ts';
import { PageVisitorsContext } from 'external/src/context/page/PageVisitorsContext.ts';
import { relativeTimestampString } from '@cord-sdk/react/common/util.ts';
import { PagePresenceContext } from 'external/src/context/presence/PagePresenceContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useCordTranslation } from '@cord-sdk/react';
import { useTime } from '@cord-sdk/react/common/effects/useTime.tsx';

interface PresenceInformation {
  isPresent: boolean;
  presenceDescription: string | undefined;
  isViewer: boolean;
}

export const usePresenceInformation = (
  externalUserID: UUID,
): PresenceInformation => {
  const { t } = useCordTranslation('presence');
  const { t: relativeT } = useCordTranslation('presence', {
    keyPrefix: 'timestamp',
  });
  const time = useTime();
  const activeUsers = useContextThrowingIfNoProvider(PagePresenceContext);
  const { visitors } = useContextThrowingIfNoProvider(PageVisitorsContext);
  const {
    byExternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const internalUser = userByID(externalUserID);
  const userID = internalUser?.id;
  const viewerData = useViewerData();

  const isViewer = useMemo(
    () => viewerData?.id === externalUserID,
    [externalUserID, viewerData?.id],
  );

  const { isPresent, presenceDescription } = useMemo(() => {
    if (activeUsers.some((user) => user.id === userID)) {
      return {
        isPresent: true,
        presenceDescription: t('viewing'),
      };
    }
    const lastSeen = visitors.find((visitor) => visitor.user.id === userID)
      ?.lastSeen;

    if (lastSeen) {
      return {
        isPresent: false,
        presenceDescription: relativeTimestampString(lastSeen, time, relativeT),
      };
    }

    // this shouldn't happen, but just in case
    return {
      isPresent: false,
      presenceDescription: undefined,
    };
  }, [activeUsers, relativeT, t, time, userID, visitors]);

  const presenceInformation = useMemo(
    () => ({ isPresent, presenceDescription, isViewer }),
    [isPresent, presenceDescription, isViewer],
  );

  return presenceInformation;
};
