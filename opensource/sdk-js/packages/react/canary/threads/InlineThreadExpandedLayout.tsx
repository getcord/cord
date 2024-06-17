import React, { forwardRef } from 'react';
import type { ThreadSummary } from '@cord-sdk/types';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import withCord from '../../experimental/components/hoc/withCord.js';

export type InlineThreadExpandedLayoutProps = {
  topLevelMessage: JSX.Element | null;
  otherMessages: JSX.Element[];
  hideRepliesButton: JSX.Element;
  composer: JSX.Element;
  thread: ThreadSummary;
  header: JSX.Element;
} & StyleProps &
  MandatoryReplaceableProps;

export const InlineThreadExpandedLayout = withCord<
  React.PropsWithChildren<InlineThreadExpandedLayoutProps>
>(
  forwardRef(function InlineThreadExpandedLayout(
    props: InlineThreadExpandedLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      topLevelMessage,
      otherMessages,
      hideRepliesButton,
      composer,
      thread,
      header,
      ...restProps
    } = props;

    return (
      <div ref={ref} data-cord-thread-id={thread.id} {...restProps}>
        {header}
        {topLevelMessage}
        {hideRepliesButton}
        {otherMessages}
        {composer}
      </div>
    );
  }),
  'InlineThreadExpandedLayout',
);
