import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import type { UUID } from 'common/types/index.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { externalizeID } from 'common/util/externalIDs.ts';

import * as classes from 'external/src/components/ui3/thread/ResolvedThreadHeader.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';

type Props = {
  threadID: UUID;
};

export function ResolvedThreadHeader({ threadID }: Props) {
  const { t } = useCordTranslation('thread');
  const thread = useThreadData()!;

  const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const { onThreadReopen } = useContextThrowingIfNoProvider(ThreadListContext);

  return (
    <div className={classes.resolvedThreadHeader}>
      <Icon name="CheckCircle" color="content-primary" size="large" />
      <p className={cx(classes.resolvedThreadHeaderText, fontSmall)}>
        {t('resolved_status')}
      </p>

      <Button
        buttonAction="reopen-thread"
        buttonType="secondary"
        size="small"
        onClick={() => {
          setResolved(threadID, false, true);
          showToastPopup?.(t('unresolve_action_success'));
          onThreadReopen?.({
            threadID: thread.externalID ?? externalizeID(threadID),
            thread: getThreadSummary(thread, userByInternalID),
          });
        }}
      >
        {t('unresolve_action')}
      </Button>
    </div>
  );
}
