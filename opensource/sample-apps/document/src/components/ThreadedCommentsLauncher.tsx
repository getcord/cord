import { ThreadedComments } from '@cord-sdk/react';
import { autoUpdate, useFloating, shift } from '@floating-ui/react';
import { useCallback, useContext, useState } from 'react';
import cx from 'classnames';
import { ThreadsContext } from '../ThreadsContext';
import { LOCATION, SAMPLE_GROUP_ID } from './Document';
import { AllCommenstIcon } from './AllCommentsIcon';

export function ThreadedCommentsLauncher() {
  const [open, setOpen] = useState(false);
  const threadsContext = useContext(ThreadsContext);

  // Using the floating-ui library to correctly handle the popup
  // behavior
  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    placement: 'bottom',
    transform: false,
    middleware: [
      // Adding a 2px padding so the comments container isn't
      // stuck to the right hand side of the page
      shift({
        padding: 2,
      }),
    ],
  });

  const toggleThreadedComments = useCallback(() => {
    setOpen((prev) => !prev);
    threadsContext?.setOpenThread(null);
  }, [threadsContext]);

  const handleClickMessage = useCallback(
    ({ threadId }: { threadId: string; messageId: string }) => {
      if (
        threadsContext?.threads.get(threadId)?.metadata.floatingThreadVisible
      ) {
        threadsContext.setOpenThread(threadId);
        setOpen(false);
      }
    },
    [threadsContext],
  );

  return (
    <>
      <div
        className={cx('click-underlay', 'comments-underlay', {
          ['show']: open,
        })}
        onClick={toggleThreadedComments}
      />
      <button
        className={cx('comments-action-button', {
          ['open']: open,
        })}
        ref={refs.setReference}
        onClick={toggleThreadedComments}
        type="button"
      >
        <AllCommenstIcon />
      </button>
      {/* Wrapping our ThreadedComments component with a reference
         container, and setting those references for the floating-ui
         library. The library handles all positioning for us as we
         scroll around. */}
      <div
        className="comments-container"
        ref={refs.setFloating}
        style={floatingStyles}
      >
        <ThreadedComments
          groupId={SAMPLE_GROUP_ID}
          location={LOCATION}
          onMessageClick={handleClickMessage}
          onThreadResolve={({ threadID }) => {
            threadsContext?.setFloatingThreadsVisibility(threadID, false);
            threadsContext?.setOpenThread(null);
          }}
          onThreadReopen={({ threadID }) => {
            threadsContext?.setFloatingThreadsVisibility(threadID, true);
            threadsContext?.setOpenThread(threadID);
            toggleThreadedComments();
          }}
          composerPosition="none"
          highlightThreadId={threadsContext?.openThread ?? undefined}
          displayResolved="interleaved"
          messageOrder="newest_on_top"
        />
      </div>
    </>
  );
}
