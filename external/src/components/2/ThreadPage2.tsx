import { useState, useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type { UUID } from 'common/types/index.ts';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { NewThread2 } from 'external/src/components/2/NewThread2.tsx';
import {
  FullPageExistingThreadTopNav2,
  FullPageNewThreadTopNav2,
} from 'external/src/components/2/ThreadPageTopNav2.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Thread2Provider } from 'external/src/context/thread2/Thread2Provider.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';

const useStyles = createUseStyles({
  fullPageThread: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: ZINDEX.popup,
  },
  threadWrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
});

type Props = {
  onClose: () => void;
  threadID: UUID;
  initialComposerAction?: ComposerAction;
} & React.ComponentProps<typeof Thread2>;

export function ThreadPage2(props: Props) {
  const { threadIDsWithMessagesIncludingDeleted } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const isDraftNewThread = useMemo(
    () => !threadIDsWithMessagesIncludingDeleted.includes(props.threadID),
    [threadIDsWithMessagesIncludingDeleted, props.threadID],
  );

  // Render provider here so we can access Thread2Context within TopNav
  return (
    <Thread2Provider
      threadID={props.threadID}
      externalThreadID={props.externalThreadID}
      threadMode={isDraftNewThread ? 'newThread' : 'fullHeight'}
      initialSlackShareChannel={null}
    >
      <ThreadPage2Component {...props} />
    </Thread2Provider>
  );
}

function ThreadPage2Component({ onClose, ...threadProps }: Props) {
  const classes = useStyles();
  const { threadMode } = useContextThrowingIfNoProvider(Thread2Context);
  const isNewThread = threadMode === 'newThread';

  const [slackChannelToShareTo, setSlackChannelToShareTo] =
    useState<SlackChannelType | null>(null);

  return (
    <Box2
      insetZero={true}
      position="absolute"
      backgroundColor="base"
      className={classes.fullPageThread}
      data-cy="cord-full-page-thread"
    >
      {isNewThread ? (
        <FullPageNewThreadTopNav2
          onClose={onClose}
          slackChannelToShareTo={slackChannelToShareTo}
          setSlackChannelToShareTo={setSlackChannelToShareTo}
        />
      ) : (
        <FullPageExistingThreadTopNav2
          onClose={() => onClose()}
          threadID={threadProps.threadID}
        />
      )}
      <Separator2 marginVertical="none" />
      <Box2 className={classes.threadWrapper}>
        {isNewThread ? (
          <NewThread2
            {...threadProps}
            slackChannelToShareTo={slackChannelToShareTo}
          />
        ) : (
          <Thread2 {...threadProps} />
        )}
      </Box2>
    </Box2>
  );
}
