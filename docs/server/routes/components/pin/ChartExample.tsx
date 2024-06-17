/** @jsxImportSource @emotion/react */
// The code is in this file showcases the Pin component and how it
// can be used to build pinned conversations on a chart with the
// Highcharts library. The intention for this code is to become
// public so that it can serve as a guide to developers building
// similar experiences.
import type HighchartsReact from 'highcharts-react-official';
import type * as Highcharts from 'highcharts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pin, thread, Thread } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import Chart from 'docs/server/routes/components/pin/Chart.tsx';

export type ChartCommentMetadata = {
  type: 'chart';
  chartId: string;
  seriesId: string;
  x: number;
  y: number;
};

const location = {
  page: DOCS_LIVE_PAGE_LOCATIONS.livePinChartExample,
};
function ChartExample() {
  const [comments, setComments] = useState<Map<string, ChartCommentMetadata>>(
    new Map(),
  );
  const addCommentToChart = useCallback(
    (threadId: string, metadata: ChartCommentMetadata) =>
      setComments((oldComments) => {
        if (oldComments.has(threadId)) {
          return oldComments;
        }
        oldComments.set(threadId, metadata);
        return new Map(oldComments);
      }),
    [],
  );
  const removeCommentFromChart = useCallback(
    (threadId: string) =>
      setComments((oldComments) => {
        if (!oldComments.has(threadId)) {
          return oldComments;
        }
        oldComments.delete(threadId);
        return new Map(oldComments);
      }),
    [],
  );

  // Fetch existing threads associated with location
  const { threads, hasMore, loading, fetchMore } = thread.useLocationData(
    location,
    { includeResolved: false },
  );
  useEffect(() => {
    if (loading) {
      return;
    }
    if (hasMore) {
      void fetchMore(50);
    }
    threads
      .filter((t) => t.total > 0)
      .forEach((t) =>
        addCommentToChart(t.id, t.metadata as ChartCommentMetadata),
      );
  }, [addCommentToChart, fetchMore, hasMore, loading, threads]);

  const [openCommentId, setOpenComment] = useState<string | null>(null);
  const rerenderCommentsRef = useRef<null | (() => void)>(null);
  const chartRef = useRef<HighchartsReact.default.RefObject>(null);

  return (
    <>
      <div
        css={{
          '&.overChartPoint': {
            cursor: 'pointer',
          },
          cursor: 'not-allowed',
          position: 'relative',
        }}
      >
        <Chart
          forwardRef={chartRef}
          setOpenComment={setOpenComment}
          addCommentToChart={addCommentToChart}
          onChartRedraw={rerenderCommentsRef}
          onMouseEnterPoint={() =>
            chartRef.current?.container.current?.parentElement?.classList.add(
              'overChartPoint',
            )
          }
          onMouseLeavePoint={() =>
            chartRef.current?.container.current?.parentElement?.classList.remove(
              'overChartPoint',
            )
          }
        />
        {chartRef.current && (
          <Comments
            rerenderCommentsRef={rerenderCommentsRef}
            comments={comments}
            chart={chartRef.current.chart}
            setOpenComment={setOpenComment}
            openCommentId={openCommentId}
            removeComment={removeCommentFromChart}
          />
        )}
      </div>
    </>
  );
}

type CommentsProps = {
  rerenderCommentsRef: React.MutableRefObject<null | (() => void)>;
  comments: Map<string, ChartCommentMetadata>;
  chart: Highcharts.Chart;
  setOpenComment: (threadId: string | null) => void;
  openCommentId: string | null;
  removeComment: (threadId: string) => void;
};

function Comments({
  comments,
  chart,
  setOpenComment,
  openCommentId,
  rerenderCommentsRef,
  removeComment,
}: CommentsProps) {
  const [_, setDummyState] = useState(false);
  rerenderCommentsRef.current = () => setDummyState((x) => !x);

  // close thread on ESCAPE key press
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenComment(null);
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [setOpenComment]);

  return (
    <>
      {Array.from(comments).map(([threadId, metadata]) => (
        <Comment
          key={threadId}
          threadId={threadId}
          metadata={metadata}
          chart={chart}
          setOpenComment={setOpenComment}
          openCommentId={openCommentId}
          removeComment={removeComment}
        />
      ))}
    </>
  );
}

type CommentProps = {
  threadId: string;
  metadata: ChartCommentMetadata;
  chart: Highcharts.Chart;
  setOpenComment: (threadId: string | null) => void;
  openCommentId: string | null;
  removeComment: (threadId: string) => void;
};
function Comment({
  threadId,
  metadata,
  chart,
  setOpenComment,
  openCommentId,
  removeComment,
}: CommentProps) {
  const previouslyVisibleRef = useRef(isPointVisible(chart, metadata));
  const isVisible = isPointVisible(chart, metadata);
  const wasVisible = previouslyVisibleRef.current;
  const isOpen = openCommentId === threadId;
  previouslyVisibleRef.current = isVisible;
  const [numberOfMessages, setNumberOfMessages] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!isVisible && isOpen) {
      setOpenComment(null);
    }
  }, [isOpen, isVisible, openCommentId, setOpenComment, threadId]);

  useEffect(() => {
    if (!isOpen && numberOfMessages !== undefined && numberOfMessages <= 0) {
      removeComment(threadId);
    }
  }, [isOpen, numberOfMessages, removeComment, threadId]);

  // close thread if click is outside thread
  const threadRef = useRef(null);
  const pinRef = useRef(null);
  useEffect(() => {
    // only the open comment should listen for clicks outside
    if (isOpen) {
      const close = (event: MouseEvent) => {
        if (
          !event
            .composedPath()
            .some((e) => e === threadRef.current || e === pinRef.current)
        ) {
          // user clicked somewhere that's not the pin nor thread
          setOpenComment(null);
        }
      };
      // Use capture=true so that listener runs before the chart click listener.
      // Otherwise chart click listener adds this comment, and this listener
      // closes it.
      document.addEventListener('click', close, true);
      return () => document.removeEventListener('click', close, true);
    }
    return () => {};
  }, [isOpen, setOpenComment, threadId]);

  return (
    // NOTE: Don't forget to set the same location on Pin and Thread
    <Pin
      forwardRef={pinRef}
      key={threadId}
      location={location}
      threadId={threadId}
      style={{
        zIndex: isOpen ? 1 : 0,
        transform: 'translateY(-100%)',
        position: 'absolute',
        top: chart.yAxis[0].toPixels(metadata.y, false),
        left: chart.xAxis[0].toPixels(metadata.x, false),
        visibility: isVisible ? 'visible' : 'hidden',
        transition: wasVisible ? 'top 0.5s, left 0.5s' : undefined,
      }}
      onClick={() => setOpenComment(isOpen ? null : threadId)}
    >
      <Thread
        forwardRef={threadRef}
        showHeader={true}
        location={location}
        threadId={threadId}
        metadata={metadata}
        style={{
          left: 0,
          position: 'absolute',
          top: '100%',
          visibility: openCommentId === threadId ? 'visible' : 'hidden',
        }}
        onThreadInfoChange={(info) => setNumberOfMessages(info.messageCount)}
        onClose={() => setOpenComment(null)}
      />
    </Pin>
  );
}

function isPointVisible(
  chart: Highcharts.Chart,
  metadata: ChartCommentMetadata,
): boolean {
  const series = chart.get(metadata.seriesId) as Highcharts.Series | undefined;
  if (!series || !series.visible) {
    return false;
  }
  const point = series.points.find(
    (p) => p.x === metadata.x && p.y === metadata.y,
  );
  if (!point) {
    return false;
  }
  return true;
}

export default ChartExample;
