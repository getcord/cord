import { useCordTranslation, user } from '@cord-sdk/react';
import type { AvatarReactComponentProps } from '@cord-sdk/react';

import { Avatar as Avatar3 } from 'external/src/components/ui3/Avatar.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';

export function Avatar({
  userId,
  enableTooltip = false,
}: AvatarReactComponentProps) {
  const { t } = useCordTranslation('user');
  const viewerData = user.useViewerData();
  const userAvatar = user.useUserData(userId);

  if (!userAvatar) {
    return null;
  }

  return (
    <>
      {enableTooltip ? (
        <WithTooltip
          label={t(
            viewerData?.id === userAvatar.id ? 'viewer_user' : 'other_user',
            {
              user: userAvatar,
            },
          )}
        >
          <Avatar3 user={userAvatar} />
        </WithTooltip>
      ) : (
        <Avatar3 user={userAvatar} />
      )}
    </>
  );
}
