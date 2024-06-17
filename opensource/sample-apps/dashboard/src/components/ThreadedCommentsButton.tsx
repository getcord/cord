import { useCallback, useContext } from 'react';
import { ThreadedComments } from '@cord-sdk/react';
import cx from 'classnames';

import {
  autoUpdate,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  size,
} from '@floating-ui/react';
import { ThreadsContext } from '../ThreadsContext';
import { LOCATION, SAMPLE_GROUP_ID } from './Dashboard';
import { CommentsIcon } from './CommentsIcon';

type Props = {
  open: boolean;
  setOpen: (f: (v: boolean) => boolean) => void;
};
export function ThreadedCommentsButton({ open, setOpen }: Props) {
  const { openThread, setRequestToOpenThread, threads, allowAutofocus } =
    useContext(ThreadsContext)!;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (value: boolean) => {
      setOpen((_) => value);
    },
    whileElementsMounted: autoUpdate,
    placement: 'bottom',
    transform: false,
    middleware: [
      shift({
        padding: 2,
      }),
      flip(),
      size({
        apply({ elements }) {
          Object.assign(elements.floating.style, {
            height: `75vh`,
          });
        },
      }),
    ],
  });

  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const toggleThreadedComments = useCallback(() => {
    setOpen((prev) => !prev);
  }, [setOpen]);

  const handleClickMessage = useCallback(
    ({ threadId }: { threadId: string | null; messageId: string | null }) => {
      setRequestToOpenThread(
        threadId === null
          ? null
          : {
              threadID: threadId,
              onThreadShownCallback: () => {
                setOpen((_) => false);
              },
            },
      );
    },
    [setOpen, setRequestToOpenThread],
  );

  return (
    <>
      <button
        className={cx('action-button', {
          ['disabled']: threads.size === 0,
          ['open-threadlist-container']: open,
        })}
        style={open ? { backgroundColor: '#6a6b6c' } : undefined}
        ref={refs.setReference}
        onClick={toggleThreadedComments}
        type="button"
        {...getReferenceProps()}
      >
        <CommentsIcon />
        All comments
      </button>
      <div
        className="threadlist-container"
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
      >
        <ThreadedComments
          groupId={SAMPLE_GROUP_ID}
          location={LOCATION}
          onMessageClick={handleClickMessage}
          composerPosition="none"
          highlightThreadId={
            allowAutofocus && openThread ? openThread : undefined
          }
          messageOrder="newest_on_top"
          displayResolved="tabbed"
        />
      </div>
    </>
  );
}
