import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { ThreadDeepLinkInfo } from 'external/src/context/deepLink/DeepLinkContext.ts';
import { DeepLinkContext } from 'external/src/context/deepLink/DeepLinkContext.ts';
import type { GlobalEvent } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { SidebarRoutes } from 'external/src/entrypoints/sidebar/routes.ts';
import type { UUID } from 'common/types/index.ts';
import { DEEP_LINK_MESSAGE_HIGHLIGHT_MS } from 'common/const/Timing.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export const DeepLinkProvider = ({
  children,
}: React.PropsWithChildren<any>) => {
  const [deepLinkInfo, setDeepLinkInfo] = useState<ThreadDeepLinkInfo | null>(
    null,
  );

  const deepLinkInProcessRef = useRef(false);
  const setDeepLinkInProcess = useCallback((deepLinkInProcess: boolean) => {
    deepLinkInProcessRef.current = deepLinkInProcess;
  }, []);

  const [highlightedMessageInfo, setHighlightedMessageInfo] = useState<null | {
    messageID: UUID;
    threadID: UUID;
  }>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { addGlobalEventListener, removeGlobalEventListener } =
    useContextThrowingIfNoProvider(GlobalEventsContext);

  useEffect(() => {
    const onGoToMessage = (message: GlobalEvent<'GO_TO_MESSAGE'>) => {
      if (location.pathname !== SidebarRoutes.CONVERSATION) {
        navigate(SidebarRoutes.CONVERSATION, { replace: true });
      }
      setDeepLinkInfo(message.data);
    };
    addGlobalEventListener('GO_TO_MESSAGE', onGoToMessage);
    return () => removeGlobalEventListener('GO_TO_MESSAGE', onGoToMessage);
  }, [addGlobalEventListener, removeGlobalEventListener, location, navigate]);

  const addDeepLinkInfo = useCallback((info: ThreadDeepLinkInfo) => {
    if (deepLinkInProcessRef.current) {
      // If another deepLink in process, ignore new deepLink request
      return;
    }
    setDeepLinkInfo(info);
  }, []);

  const onNavigateToDeepLink = useCallback(() => {
    const messageID = deepLinkInfo?.messageID ?? null;
    setDeepLinkInfo(null);
    if (messageID) {
      setHighlightedMessageInfo({
        threadID: deepLinkInfo!.threadID,
        messageID,
      });
      setTimeout(() => {
        setHighlightedMessageInfo((prev) =>
          prev?.messageID === messageID ? null : prev,
        );
      }, DEEP_LINK_MESSAGE_HIGHLIGHT_MS);
    }
  }, [deepLinkInfo]);
  const clearDeepLinkInfo = useCallback(() => setDeepLinkInfo(null), []);

  const deepLinkedMessageRef = useRef<HTMLDivElement | null>(null);
  const getDeepLinkedMessageElement = useCallback(
    () => deepLinkedMessageRef.current,
    [],
  );
  const setDeepLinkedMessageElement = useCallback(
    (div: HTMLDivElement | null) => {
      deepLinkedMessageRef.current = div;
    },
    [],
  );

  const shouldShowDeepLinkHighlight = useCallback(
    (threadID: UUID, ...messages: Array<{ id: UUID }>) => {
      return Boolean(
        highlightedMessageInfo &&
          highlightedMessageInfo.threadID === threadID &&
          messages.some((msg) => msg.id === highlightedMessageInfo.messageID),
      );
    },
    [highlightedMessageInfo],
  );

  const contextValue = useMemo(
    () => ({
      deepLinkInfo,
      addDeepLinkInfo,
      clearDeepLinkInfo,
      getDeepLinkedMessageElement,
      setDeepLinkedMessageElement,
      deepLinkedMessageRef,
      setDeepLinkInProcess,
      onNavigateToDeepLink,
      shouldShowDeepLinkHighlight,
    }),
    [
      addDeepLinkInfo,
      clearDeepLinkInfo,
      deepLinkInfo,
      getDeepLinkedMessageElement,
      onNavigateToDeepLink,
      setDeepLinkInProcess,
      setDeepLinkedMessageElement,
      shouldShowDeepLinkHighlight,
    ],
  );

  return (
    <DeepLinkContext.Provider value={contextValue}>
      {children}
    </DeepLinkContext.Provider>
  );
};
