import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';
import { useViewerData } from '../../hooks/user.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import { Avatar, SendComposer } from '../../betaV2.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import { inlineComposer } from './Threads.classnames.js';

export type InlineComposerProps = {
  threadID: string;
  hidden: boolean;
} & StyleProps &
  MandatoryReplaceableProps;

export const InlineComposer = withCord<
  React.PropsWithChildren<InlineComposerProps>
>(
  forwardRef(function InlineComposer(
    { className, hidden, threadID, ...restProps }: InlineComposerProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const viewer = useViewerData();

    if (hidden) {
      return null;
    }

    return (
      <div ref={ref} className={cx(inlineComposer, className)} {...restProps}>
        <Avatar user={viewer} canBeReplaced />
        <SendComposer canBeReplaced threadID={threadID} expanded="auto" />
      </div>
    );
  }),
  'InlineComposer',
);
