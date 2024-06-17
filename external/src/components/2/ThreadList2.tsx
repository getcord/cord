import { useRef } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { ScrollContainerProvider2 } from 'external/src/components/2/ScrollContainer2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export const THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR = cssVar('space-xl');

const spinnerStyle = {
  height: `calc(100% - ${THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR})`,
  width: `calc(100% - ${THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR})`,
};

const useStyles = createUseStyles({
  threadsScrollContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: cssVar('space-xl'),
    maxHeight: '100%',
    position: 'relative',
    overflow: 'auto',
    overflowAnchor: 'none', // Stops chrome automatically changing scroll when content added
    overscrollBehavior: 'contain', // Stops scroll chaining to main webpage
  },
  threadScrollContainerInbox: {
    padding: `${THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR} ${cssVar(
      'inbox-content-horizontal-padding',
    )}`,
  },
  threadsScrollContainerNonInbox: {
    padding: `${THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR} ${cssVar(
      'space-2xs',
    )}`,
  },
});

type Props = {
  showLoadingSpinner: boolean;
};

export function ThreadList2({
  children,
  showLoadingSpinner,
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();
  const threadsContainerRef = useRef<HTMLDivElement>(null);

  const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const isSDKInboxComponent =
    name === 'cord-inbox' || name === 'cord-inbox-launcher';

  return (
    <MessageSeenObserverProvider containerRef={threadsContainerRef}>
      <ScrollContainerProvider2
        className={cx(classes.threadsScrollContainer, {
          [classes.threadScrollContainerInbox]: isSDKInboxComponent,
          [classes.threadsScrollContainerNonInbox]: !isSDKInboxComponent,
        })}
        ref={threadsContainerRef}
      >
        {!showLoadingSpinner ? (
          children
        ) : (
          <SpinnerCover size="3xl" containerStyle={spinnerStyle} />
        )}
      </ScrollContainerProvider2>
    </MessageSeenObserverProvider>
  );
}
