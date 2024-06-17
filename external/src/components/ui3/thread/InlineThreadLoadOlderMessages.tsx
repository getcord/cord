import { useState } from 'react';

import { useCordTranslation } from '@cord-sdk/react';
import { THREAD_LOAD_MORE_MESSAGES_COUNT } from 'common/const/Api.ts';
import { ButtonWithUnderline } from 'external/src/components/ui3/ButtonWithUnderline.tsx';
import * as classes from 'external/src/components/ui3/thread/InlineThreadLoadOlderMessages.css.ts';

type Props = {
  loadOlderMessages: (numberOfMessages: number) => void;
  olderMessagesCount: number;
};

export function InlineThreadLoadOlderMessages({
  loadOlderMessages,
  olderMessagesCount,
}: Props) {
  const { t } = useCordTranslation('thread');
  const [initialOlderMessageCount] = useState(olderMessagesCount);

  // Don't make space for loading older messages if there never were any
  if (initialOlderMessageCount === 0) {
    return null;
  }

  return (
    <div className={classes.loadOlderMessages}>
      <ButtonWithUnderline
        buttonAction="load-older-messages"
        label={t('show_more', {
          count: Math.min(olderMessagesCount, THREAD_LOAD_MORE_MESSAGES_COUNT),
        })}
        onClick={() => loadOlderMessages(THREAD_LOAD_MORE_MESSAGES_COUNT)}
      />
    </div>
  );
}
