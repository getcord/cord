import * as React from 'react';
import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import type { UUID } from 'common/types/index.ts';
import { InboxThreadHeader2 } from 'external/src/components/2/InboxThreadHeader2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadHoverStyles2 } from 'external/src/components/2/hooks/useThreadHoverStyles2.ts';
import { NOT_GREYABLE_CLASS_NAME } from 'common/const/Styles.ts';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';

const greyTextSelector = `& *:is(p, span, a):not(.${NOT_GREYABLE_CLASS_NAME})`;

const useStyles = createUseStyles({
  greyText: {
    [greyTextSelector]: {
      color: `${cssVar('color-content-secondary')} !important`,
    },
  },
  cursorPointer: {
    cursor: 'pointer',
  },
});

export const InboxThread2 = React.memo(function InboxThread2({
  threadID,
  read,
  expanded,
  collapseThread,
  expandThread,
  markThreadAsRead,
}: {
  threadID: UUID;
  read: boolean;
  expanded: boolean;
  collapseThread: () => void;
  expandThread: (threadID: UUID, unread: boolean) => void;
  markThreadAsRead: (threadID: UUID) => void;
}) {
  const classes = useStyles();
  const hoverClasses = useThreadHoverStyles2();

  const header = useMemo(
    () => (
      <InboxThreadHeader2
        threadID={threadID}
        collapseThread={expanded ? collapseThread : undefined}
        markThreadAsRead={!read ? markThreadAsRead : undefined}
        read={read}
        showButtons={true}
      />
    ),
    [collapseThread, expanded, markThreadAsRead, read, threadID],
  );

  return (
    <Box2
      key={threadID}
      onClick={expanded ? undefined : () => expandThread(threadID, !read)}
      className={cx({
        [classes.greyText]: read && !expanded,
        [hoverClasses.inboxThread]: !expanded,
        [hoverClasses.expandedInboxThread]: expanded,
        [classes.cursorPointer]: !expanded,
      })}
    >
      <Thread2
        key={threadID}
        threadID={threadID}
        mode={expanded ? 'inline' : 'collapsed'}
        threadHeader={header}
      />
    </Box2>
  );
});
