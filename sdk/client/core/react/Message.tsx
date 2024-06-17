import { memo, useEffect, useMemo, useRef } from 'react';
import type { MessageReactComponentProps } from '@cord-sdk/react';
import { Thread2Provider } from 'external/src/context/thread2/Thread2Provider.tsx';
import type { ThreadListContextProps } from 'sdk/client/core/react/ThreadList.tsx';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';
import { DisabledScrollContainerProvider } from 'external/src/components/2/ScrollContainer2.tsx';
import { DisabledAnnotationPillDisplayProvider } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { ComposerProvider } from 'external/src/context/composer/ComposerProvider.tsx';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { AnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { MessageImpl } from 'external/src/components/2/MessageImpl.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { useMessageByExternalID } from 'sdk/client/core/react/useMessageByExternalId.tsx';
import { useDispatchEventOnce } from 'external/src/effects/useDispatchEventOnce.ts';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

function Message({
  threadId,
  messageId,
  markAsSeen = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isEditing,
  onThreadResolve,
  onThreadReopen,
}: MessageReactComponentProps) {
  const messageContainerRef = useRef(null);
  const { thread, message } = useMessageByExternalID({
    threadID: threadId,
    messageID: messageId,
  });

  const dispatchLoadingEvent = useDispatchEventOnce('loading');
  const dispatchRenderEvent = useDispatchEventOnce('render');
  useEffect(() => {
    if (message === null || thread === null) {
      dispatchLoadingEvent();
    } else {
      dispatchRenderEvent();
    }
  }, [dispatchLoadingEvent, dispatchRenderEvent, message, thread]);

  const ctx: ThreadListContextProps = useMemo(
    () => ({
      onThreadClick: () => {},
      onThreadResolve,
      onThreadReopen,
      highlightOpenFloatingThread: undefined,
      highlightThreadExternalID: undefined,
    }),
    [onThreadResolve, onThreadReopen],
  );

  if (!thread || !message) {
    return null;
  }

  const isFirstMessageOfThread = thread.messages[0].id === message.id;
  return (
    <GlobalElementProvider>
      <MessageSeenObserverProvider
        containerRef={messageContainerRef}
        disabled={!markAsSeen}
      >
        <ThreadListContext.Provider value={ctx}>
          <Thread2Provider
            threadID={thread.id}
            externalThreadID={thread.externalID}
            threadMode={'fullHeight'}
            initialSlackShareChannel={null}
          >
            <DeepLinkProvider>
              <DisabledScrollContainerProvider>
                <DisabledAnnotationPillDisplayProvider>
                  <DisabledCSSVariableOverrideContextProvider>
                    <AnnotationsConfigProvider showPinsOnPage={false}>
                      <AnnotationsOnPageProvider>
                        <PagePresenceAndVisitorsShim>
                          <ComposerProvider>
                            <MessageImpl
                              message={message}
                              isFirstMessageOfThread={isFirstMessageOfThread}
                              onClick={onClick}
                              onMouseEnter={onMouseEnter}
                              onMouseLeave={onMouseLeave}
                              isEditing={isEditing}
                            />
                          </ComposerProvider>
                        </PagePresenceAndVisitorsShim>
                      </AnnotationsOnPageProvider>
                    </AnnotationsConfigProvider>
                  </DisabledCSSVariableOverrideContextProvider>
                </DisabledAnnotationPillDisplayProvider>
              </DisabledScrollContainerProvider>
            </DeepLinkProvider>
          </Thread2Provider>
        </ThreadListContext.Provider>
      </MessageSeenObserverProvider>
    </GlobalElementProvider>
  );
}

export default memo(Message);
