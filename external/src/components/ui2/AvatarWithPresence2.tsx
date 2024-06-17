import { useCallback } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import type { StyleProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import type { ClientUserData } from '@cord-sdk/types';

import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { usePresenceInformation } from 'external/src/effects/usePresenceInformation.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

type Props = {
  user: ClientUserData;
  size?: 'l' | 'm' | 'xl';
} & StyleProps<'marginPadding'>;

/**
 * @deprecated Use ui3/AvatarWithPresence instead
 */
export const AvatarWithPresence2 = ({
  user,
  size = 'l',
  ...styleProps
}: Props) => {
  const { t } = useCordTranslation('user');
  const { isPresent, presenceDescription, isViewer } = usePresenceInformation(
    user.id,
  );

  const { logEvent } = useLogger();

  const onHover = useCallback(() => {
    logEvent('hover-for-presence');
  }, [logEvent]);

  return (
    <WithTooltip2
      label={isViewer ? t('viewer_user', { user }) : t('other_user', { user })}
      subtitle={presenceDescription}
      nowrap={true}
      onHover={onHover}
    >
      <Avatar2
        user={user}
        size={size}
        translucent={!isPresent}
        {...styleProps}
      />
    </WithTooltip2>
  );
};
