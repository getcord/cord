import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';

import * as classes from 'external/src/components/ui3/thread/UnreadMessageIndicator.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

export const UnreadMessageIndicator = forwardRef(
  function UnreadMessageIndicator(
    {
      subscribed,
    }: {
      subscribed: boolean;
    },
    ref?: ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('thread');
    return (
      <p
        className={cx(classes.unreadMessageIndicator, {
          [MODIFIERS.subscribed]: subscribed,
        })}
        ref={ref}
      >
        {t('new_status')}
      </p>
    );
  },
);
