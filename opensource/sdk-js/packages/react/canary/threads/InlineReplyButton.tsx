import React, { forwardRef, useMemo } from 'react';
import cx from 'classnames';
import { Button, Facepile } from '../../betaV2.js';
import type { StyleProps } from '../../betaV2.js';
import { fontSmall } from '../../common/ui/atomicClasses/fonts.css.js';
import { useCordTranslation } from '../../index.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import classes from './Threads.css.js';

export type InlineReplyButtonProps = {
  onClick: () => void;
  unreadCount: number;
  replyCount: number;
  allRepliersIDs: string[];
} & StyleProps &
  MandatoryReplaceableProps;

export const InlineReplyButton = withCord<
  React.PropsWithChildren<InlineReplyButtonProps>
>(
  forwardRef(function InlineReplyButton(
    {
      className,
      unreadCount,
      replyCount,
      allRepliersIDs,
      ...restProps
    }: InlineReplyButtonProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('thread_preview');
    const label = useMemo(() => {
      if (replyCount === 0) {
        return t('reply_action');
      }

      if (unreadCount > 0) {
        return t('show_replies_action_unread', { count: unreadCount });
      }

      return t('show_replies_action_read', { count: replyCount });
    }, [replyCount, t, unreadCount]);

    return (
      <div
        className={cx(classes.inlineReplyButton, fontSmall, className)}
        ref={ref}
        {...restProps}
      >
        <Facepile.ByID userIDs={allRepliersIDs} canBeReplaced />
        <Button
          buttonAction="expand-inline-thread"
          canBeReplaced
          className={fontSmall}
        >
          {label}
        </Button>
      </div>
    );
  }),
  'InlineReplyButton',
);
