import { useCallback, useRef } from 'react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { unfinishedMessageWarningText } from 'external/src/common/strings.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

// NB similar functionality is implemented without this hook in Conversation2
// for the sidebar/full page threads - there is a note there explaining why it
// doesn't use this hook
export function useCloseThreadWithWarning(closeThread: () => void) {
  const { logEvent } = useLogger();
  // This implementation of draftMessageInComposer (a single boolean in
  // ThreadsContext) will need rethinking if we allow multiple Floating Threads
  // to be open at one time
  const { draftMessageInComposer } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const { dispatch } = useContextThrowingIfNoProvider(DelegateContext);
  const modalOpenRef = useRef(false);

  return useCallback(
    (event?: Event) => {
      // This hook could be triggered again by clicking the modal buttons (because
      // you're clicking outside the thread again) in which case running the event.stopPropagation
      // below will block the user's ability to click said buttons and you get stuck
      // with the modal open
      if (modalOpenRef.current === true) {
        return;
      }

      if (draftMessageInComposer) {
        event?.stopPropagation();
        modalOpenRef.current = true;
        dispatch({
          type: 'SHOW_CONFIRM_MODAL',
          confirmModal: {
            ...unfinishedMessageWarningText,
            onConfirm: () => {
              logEvent('thread-closed', {
                hadDraft: true,
                keptDraft: false,
              });
              closeThread();
              dispatch({ type: 'HIDE_CONFIRM_MODAL' });
              modalOpenRef.current = false;
            },
            onReject: () => {
              logEvent('thread-closed', {
                hadDraft: true,
                keptDraft: true,
              });
              dispatch({ type: 'HIDE_CONFIRM_MODAL' });
              modalOpenRef.current = false;
            },
          },
        });
      } else {
        logEvent('thread-closed', {
          hadDraft: false,
        });
        closeThread();
      }
    },
    [closeThread, dispatch, draftMessageInComposer, logEvent],
  );
}
