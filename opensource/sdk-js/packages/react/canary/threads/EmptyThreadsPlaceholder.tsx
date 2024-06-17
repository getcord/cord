import React, { useMemo, forwardRef } from 'react';
import type { Ref } from 'react';
import type { ThreadsData } from '@cord-sdk/types';
import { useSearchUsers } from '../../hooks/user.js';
import { useCordTranslation } from '../../index.js';
import { EmptyPlaceholder } from '../EmptyPlaceholder.js';

type EmptyThreadsPlaceholderProps = {
  threadsData: ThreadsData;
  groupID?: string;
};
export const EmptyThreadsPlaceholderWrapper = forwardRef(
  function EmptyThreadsPlaceholderWrapper(
    { groupID, threadsData }: EmptyThreadsPlaceholderProps,
    ref: Ref<HTMLElement>,
  ) {
    const { t } = useCordTranslation('threads');
    const placeholderUsers = useSearchUsers({
      groupID,
      skip: !groupID,
    });

    const threads = useMemo(() => threadsData.threads, [threadsData.threads]);

    return (
      <EmptyPlaceholder
        ref={ref}
        canBeReplaced
        type="threads-placeholder"
        users={placeholderUsers?.users ?? []}
        hidden={threadsData.loading || (threads && threads.length > 0)}
        title={t('placeholder_title')}
        body={t('placeholder_body')}
      />
    );
  },
);
