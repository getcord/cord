import type { ThreadSummary } from '@cord-sdk/types';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import type { DisplayResolved } from '../components/ThreadedComments.js';

export function useEnsureHighlightedThreadVisible({
  maybeThreadToHighlight,
  displayResolved,
  setResolvedTabSelected,
  setExpandResolved,
}: {
  maybeThreadToHighlight?: ThreadSummary;
  displayResolved: DisplayResolved;
  setResolvedTabSelected: Dispatch<SetStateAction<boolean>>;
  setExpandResolved: Dispatch<SetStateAction<boolean>>;
}) {
  const previouslyHighlightedThread = useRef<string | null>(null);

  useEffect(() => {
    if (!maybeThreadToHighlight) {
      return;
    }

    // Updating the states of the `resolved tabs` and the `expand resolved`
    // button according to the highlighted thread (initial or updated)
    if (maybeThreadToHighlight.id !== previouslyHighlightedThread.current) {
      setResolvedTabSelected(
        maybeThreadToHighlight.resolved || displayResolved === 'resolvedOnly',
      );

      setExpandResolved(
        maybeThreadToHighlight.resolved && displayResolved === 'sequentially',
      );
      previouslyHighlightedThread.current = maybeThreadToHighlight.id;
    }
  }, [
    displayResolved,
    maybeThreadToHighlight,
    setExpandResolved,
    setResolvedTabSelected,
  ]);
}
