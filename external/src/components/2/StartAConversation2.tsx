import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import { v4 as uuid } from 'uuid';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import { EmptyStateWithFacepile } from 'external/src/components/2/EmptyStateWithFacepile.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import NewThread2Provider from 'external/src/context/thread2/NewThread2Provider.tsx';
import type { UUID } from 'common/types/index.ts';
import { useGetPageVisitorsAndUsers } from 'external/src/components/2/hooks/useGetPageVisitorsAndUsers.ts';

const useStyles = createUseStyles({
  startConversationContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  emptyStateContainer: {
    margin: 0,
  },
  composer: {
    padding: cssVar('space-2xs'),
    paddingTop: '0',
  },
});

type Props = {
  composeNewThread: (composerAction?: ComposerAction) => unknown;
  setOpenThreadID: (threadID: UUID) => unknown;
};

export function StartAConversation2({ setOpenThreadID }: Props) {
  const classes = useStyles();

  const usersToShow = useGetPageVisitorsAndUsers();

  const newThreadID = uuid();

  const onSendMessage = useCallback(() => {
    setOpenThreadID(newThreadID);
  }, [newThreadID, setOpenThreadID]);

  return (
    <NewThread2Provider threadID={newThreadID} slackChannelToShareTo={null}>
      <Box2 className={classes.startConversationContainer}>
        <EmptyStateWithFacepile
          users={usersToShow.slice(0, 4)}
          className={classes.emptyStateContainer}
        />
        <Composer3
          showBorder={true}
          showExpanded={true}
          onSendMessage={onSendMessage}
          className={classes.composer}
          shouldFocusOnMount={true}
        />
      </Box2>
    </NewThread2Provider>
  );
}
