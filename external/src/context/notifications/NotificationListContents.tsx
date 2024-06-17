import { useCallback, useMemo, useRef } from 'react';
import { debounce } from 'radash';

import { ScrollContainerProvider } from 'external/src/components/ui3/ScrollContainer.tsx';

type Props = {
  fetchAdditionalNotifications: () => unknown;
};

export function NotificationListContents({
  fetchAdditionalNotifications,
  children,
}: React.PropsWithChildren<Props>) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const onScroll = useCallback(
    (scrollTop: number) => {
      if (scrollContainerRef.current) {
        const isScrolledToBottom =
          scrollContainerRef.current.scrollHeight -
            scrollContainerRef.current.clientHeight -
            scrollTop <
          1;

        if (isScrolledToBottom) {
          fetchAdditionalNotifications();
        }
      }
    },
    [fetchAdditionalNotifications],
  );

  const throttledOnScroll = useMemo(
    () => debounce({ delay: 100 }, onScroll),
    [onScroll],
  );

  return (
    <ScrollContainerProvider
      onScroll={throttledOnScroll}
      ref={scrollContainerRef}
    >
      {children}
    </ScrollContainerProvider>
  );
}
