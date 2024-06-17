import { useState } from 'react';
import { createUseStyles } from 'react-jss';

import { THREAD_LOAD_MORE_MESSAGES_COUNT } from 'common/const/Api.ts';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  hrLeft: {
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
    flex: 'none',
    width: cssVar(`space-${MESSAGE_BLOCK_AVATAR_SIZE}`),
  },
  hrRight: {
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
    flex: 1,
  },
});

type Props = {
  loadOlderMessages: (numberOfMessages: number) => void;
  olderMessagesCount: number;
};

export function InlineThreadLoadOlderMessages2({
  loadOlderMessages,
  olderMessagesCount,
}: Props) {
  const classes = useStyles();
  const [initialOlderMessageCount] = useState(olderMessagesCount);

  // Don't make space for loading older messages if there never were any
  if (initialOlderMessageCount === 0) {
    return null;
  }

  return (
    <MessageBlockRow2
      paddingHorizontal="2xs"
      leftElement={<div className={classes.hrLeft} />}
    >
      <BasicButtonWithUnderline2
        label={`Show ${Math.min(
          olderMessagesCount,
          THREAD_LOAD_MORE_MESSAGES_COUNT,
        )} more`}
        onClick={() => loadOlderMessages(THREAD_LOAD_MORE_MESSAGES_COUNT)}
        labelColor="content-primary"
      />
      <div className={classes.hrRight} />
    </MessageBlockRow2>
  );
}
