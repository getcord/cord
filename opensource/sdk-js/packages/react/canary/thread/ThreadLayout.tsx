import * as React from 'react';
import { forwardRef } from 'react';

import type { ClientThreadData } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import { ThreadScrollContainer } from './ThreadScrollContainer.js';

export type ThreadLayoutProps = {
  threadData: ClientThreadData;
  header: JSX.Element | null;
  messages: JSX.Element[];
  emptyThreadPlaceholder: JSX.Element;
  loadingIndicator: JSX.Element;
  threadSeenBy: JSX.Element;
  composer: JSX.Element;
  typingIndicator: JSX.Element;
} & StyleProps &
  MandatoryReplaceableProps;

export const ThreadLayout = withCord<
  React.PropsWithChildren<ThreadLayoutProps>
>(
  forwardRef(function ThreadLayout(
    props: ThreadLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      composer,
      header,
      messages,
      threadData,
      emptyThreadPlaceholder,
      loadingIndicator,
      threadSeenBy,
      typingIndicator,
      ...restProps
    } = props;

    return (
      <div
        {...restProps}
        ref={ref}
        data-cord-thread-id={threadData?.thread?.id}
      >
        {header}
        <ThreadScrollContainer
          fetchMore={threadData.fetchMore}
          threadLoading={!!threadData.loading}
          hasMore={threadData.hasMore}
        >
          {emptyThreadPlaceholder}
          {loadingIndicator}
          {messages}
          {threadSeenBy}
          {typingIndicator}
        </ThreadScrollContainer>
        {composer}
      </div>
    );
  }),
  'ThreadLayout',
);
