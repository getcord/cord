import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import type { Ref } from 'react';
import type { ClientThreadData } from '@cord-sdk/types';

import { useCordTranslation } from '../../hooks/useCordTranslation.js';
import { useSearchUsers } from '../../hooks/user.js';
import { EmptyPlaceholder } from '../EmptyPlaceholder.js';

export const EmptyThreadPlaceholderWrapper = forwardRef(
  function EmptyThreadPlaceholderWrapper(
    {
      groupID,
      threadData,
    }: {
      groupID?: string;
      threadData?: ClientThreadData;
    },
    ref: Ref<HTMLElement>,
  ) {
    const { t } = useCordTranslation('thread');
    const placeholderUsers = useSearchUsers({
      groupID,
      skip: !groupID,
    });

    const thread = useMemo(() => threadData?.thread, [threadData?.thread]);
    const messages = useMemo(
      () => threadData?.messages ?? [],
      [threadData?.messages],
    );

    // Hide placeholder when thread data is still loading (this prevents a flicker
    // of the placeholder) when fetching for data or when a thread has messages.
    const hide =
      threadData?.loading || (thread !== null && messages.length > 0);

    return (
      <EmptyPlaceholder
        ref={ref}
        type="thread-placeholder"
        users={placeholderUsers?.users ?? []}
        hidden={hide}
        title={t('placeholder_title')}
        body={t('placeholder_body')}
        canBeReplaced
      />
    );
  },
);
