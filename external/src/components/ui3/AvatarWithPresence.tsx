import { useCallback } from 'react';
import { useCordTranslation } from '@cord-sdk/react';
import type { ClientUserData } from '@cord-sdk/types';

import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import { usePresenceInformation } from 'external/src/effects/usePresenceInformation.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';

type Props = {
  user: ClientUserData;
  size?: 'l' | 'm' | 'xl';
};

export const AvatarWithPresence = ({ user, size = 'l' }: Props) => {
  const { t } = useCordTranslation('user');
  const { isPresent, presenceDescription, isViewer } = usePresenceInformation(
    user.id,
  );

  const { logEvent } = useLogger();

  const onHover = useCallback(() => {
    logEvent('hover-for-presence');
  }, [logEvent]);

  return (
    <WithTooltip
      label={isViewer ? t('viewer_user', { user }) : t('other_user', { user })}
      subtitle={presenceDescription}
      onHover={onHover}
    >
      <Avatar user={user} size={size} translucent={!isPresent} />
    </WithTooltip>
  );
};
