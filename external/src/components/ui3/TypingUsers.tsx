import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import { Facepile } from 'external/src/components/ui3/Facepile.tsx';
import type { UserFragment } from 'external/src/graphql/operations.ts';

import * as classes from 'external/src/components/ui3/TypingUsers.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

export function TypingUsers({ users }: { users: UserFragment[] }) {
  const { t } = useCordTranslation('thread');

  if (!users.length) {
    return null;
  }

  return (
    <div className={classes.typing}>
      <Facepile users={usersToUserData(users)} showPresence={false} />
      <p
        className={cx(classes.typingIndicator, fontSmall)}
        color="content-secondary"
      >
        {t('typing_users_status')}
      </p>
    </div>
  );
}
