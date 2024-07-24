import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { EmptyStateWithFacepile } from 'external/src/components/2/EmptyStateWithFacepile.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { EntityMetadata } from '@cord-sdk/types';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { useGetPageVisitorsAndUsers } from 'external/src/components/2/hooks/useGetPageVisitorsAndUsers.ts';

const useStyles = createUseStyles({
  emptyStateContainer: {
    paddingTop: cssVar('space-xl'),
    paddingLeft: cssVar('space-xl'),
    paddingRight: cssVar('space-xl'),
  },
  emptyStateComposer: {
    padding: cssVar('space-2xs'),
  },
});

type EmptyThreadProps = {
  showPlaceholder: boolean;
  composerExpanded: boolean;
  threadMetadata?: EntityMetadata;
};

export function EmptyThread2({
  showPlaceholder,
  composerExpanded,
  threadMetadata,
}: EmptyThreadProps) {
  const classes = useStyles();
  const usersToShow = useGetPageVisitorsAndUsers();
  return (
    <>
      {showPlaceholder && (
        <EmptyStateWithFacepile
          users={usersToShow}
          className={classes.emptyStateContainer}
        />
      )}
      <Composer3
        shouldFocusOnMount={true}
        size="medium"
        showBorder={showPlaceholder}
        showExpanded={composerExpanded ?? showPlaceholder}
        className={cx({
          [classes.emptyStateComposer]: showPlaceholder,
        })}
        threadMetadata={threadMetadata}
      />
    </>
  );
}
