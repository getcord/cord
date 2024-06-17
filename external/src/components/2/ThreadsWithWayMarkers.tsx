import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import type { UUID } from 'common/types/index.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  isTimestampFromPastSevenDays,
  isTimestampFromPastThirtyDays,
  isTimestampFromPastThreeMonths,
  isTimestampFromPastYear,
  isTimestampMoreThanAYearAgo,
  isTimestampTodayOrInTheFuture,
} from 'common/util/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

const REORDER_THREADS_INTERVAL_MS = 5000;

const useStyles = createUseStyles({
  threadWrapper: {
    cursor: 'pointer',
  },
});

type ThreadIDsByWayMarker = {
  label: string;
  threadIDs: string[];
  wayMarkerCheckFn: (timestamp: string) => boolean;
};

type Props = {
  onThreadClick: (threadID: UUID) => unknown;
  threadIDs: string[];
};

export function ThreadsWithWayMarkers({ onThreadClick, threadIDs }: Props) {
  const { reorderThreads, getThreadUpdatingRef } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const { logError } = useLogger();

  useEffect(() => {
    const interval = setInterval(() => {
      reorderThreads();
    }, REORDER_THREADS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reorderThreads]);

  const sortThreadIDsByWaymarkers = useMemo(() => {
    const wayMarkerTimePeriods: ThreadIDsByWayMarker[] = [
      {
        label: 'Today',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampTodayOrInTheFuture,
      },
      {
        label: 'Past 7 days',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampFromPastSevenDays,
      },
      {
        label: 'Past 30 days',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampFromPastThirtyDays,
      },
      {
        label: 'Past 3 months',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampFromPastThreeMonths,
      },
      {
        label: 'Past year',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampFromPastYear,
      },
      {
        label: 'More than a year ago',
        threadIDs: [],
        wayMarkerCheckFn: isTimestampMoreThanAYearAgo,
      },
    ];

    threadIDs.forEach((threadID) => {
      const threadData = getThreadUpdatingRef(threadID).current;
      if (!threadData || threadData.messages.length === 0) {
        return;
      }

      const lastMessageTimestamp =
        threadData.messages[threadData.messages.length - 1].timestamp;

      const wayMarkerChecker = wayMarkerTimePeriods.find((checker) =>
        checker.wayMarkerCheckFn(lastMessageTimestamp),
      );
      if (!wayMarkerChecker) {
        logError('Could not sort thread in way markers', {
          threadID,
          lastMessageTimestamp,
        });
        return;
      }
      wayMarkerChecker.threadIDs.push(threadID);
    });

    return wayMarkerTimePeriods;
  }, [threadIDs, getThreadUpdatingRef, logError]);

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
      {sortThreadIDsByWaymarkers.map(({ threadIDs, label }) => {
        if (threadIDs.length === 0) {
          return null;
        }
        return (
          <ThreadsWithWayMarker
            key={label}
            label={label}
            threadIDs={threadIDs}
            onThreadClick={onThreadClick}
          />
        );
      })}
    </>
  );
}

function ThreadsWithWayMarker({
  threadIDs,
  label,
  onThreadClick,
}: Omit<ThreadIDsByWayMarker, 'wayMarkerCheckFn'> & {
  onThreadClick: (threadID: UUID) => unknown;
}) {
  const classes = useStyles();

  return (
    <React.Fragment>
      <Text2 color="content-primary" font="small" center={true}>
        {label}
      </Text2>
      {threadIDs.map((threadID: UUID) => (
        <Box2
          key={threadID}
          onClick={() => onThreadClick(threadID)}
          className={classes.threadWrapper}
        >
          <Thread2
            mode="collapsed"
            threadID={threadID}
            showThreadOptions={true}
            showMessageOptions={false}
          />
        </Box2>
      ))}
    </React.Fragment>
  );
}
