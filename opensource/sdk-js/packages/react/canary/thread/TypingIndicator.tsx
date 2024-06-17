import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import type { Ref } from 'react';

import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';

import { Facepile } from '../../experimental/components/Facepile.js';
import { useCordTranslation } from '../../hooks/useCordTranslation.js';
import { fontSmall } from '../../common/ui/atomicClasses/fonts.css.js';
import { useUserData } from '../../hooks/user.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import * as classes from './TypingIndicator.css.js';

type TypingIndicatorWrapperProps = { usersID?: string[] };
export const TypingIndicatorWrapper = forwardRef(
  function TypingIndicatorWrapper(
    { usersID }: TypingIndicatorWrapperProps,
    ref: Ref<HTMLElement>,
  ) {
    const usersByID = useUserData(usersID ?? [], {
      skip: !usersID || usersID.length === 0,
    });

    const users = useMemo(() => {
      // `useUserData` hook will return the previous data if skip becomes `true`
      // TODO remove once the hook is fixed.
      if (usersID?.length === 0) {
        return [];
      }
      return Object.values(usersByID ?? {}).filter(Boolean) as ClientUserData[];
    }, [usersByID, usersID]);

    return <TypingIndicator ref={ref} users={users} canBeReplaced />;
  },
);

export type TypingIndicatorProps = { users: ClientUserData[] };
export const TypingIndicator = withCord<
  React.PropsWithChildren<TypingIndicatorProps>
>(
  forwardRef(function TypingIndicator(
    { users }: TypingIndicatorProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('thread');

    if (!users.length) {
      return null;
    }

    return (
      <div className={classes.typing} ref={ref}>
        <Facepile canBeReplaced users={users} />
        <p className={cx(classes.typingIndicator, fontSmall)}>
          {t('typing_users_status')}
        </p>
      </div>
    );
  }),
  'TypingIndicator',
);
