import { memo, useEffect, useMemo, useRef } from 'react';
import type { MessageContentReactComponentProps } from '@cord-sdk/react';
import { MessageContentImpl } from 'external/src/components/2/MessageContentImpl.tsx';
import { DisabledScrollContainerProvider } from 'external/src/components/2/ScrollContainer2.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { DisabledAnnotationPillDisplayProvider } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { AnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { DisabledThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import type { MessageContent as MessageContentType } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import type {
  MessageFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import type { MessageAttachment } from '@cord-sdk/types';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { getReferencedUserIDs } from 'common/util/index.ts';

function MessageContent({
  content,
  attachments,
  edited,
}: MessageContentReactComponentProps) {
  const messageContainerRef = useRef(null);

  if (!content) {
    return null;
  }

  return (
    <GlobalElementProvider>
      <MessageSeenObserverProvider
        containerRef={messageContainerRef}
        disabled={true}
      >
        <DisabledThreadListContext>
          <DeepLinkProvider>
            <DisabledScrollContainerProvider>
              <DisabledAnnotationPillDisplayProvider>
                <DisabledCSSVariableOverrideContextProvider>
                  <AnnotationsConfigProvider showPinsOnPage={false}>
                    <AnnotationsOnPageProvider>
                      <MessageContentInternal
                        attachments={attachments ?? []}
                        content={content}
                        edited={!!edited}
                      />
                    </AnnotationsOnPageProvider>
                  </AnnotationsConfigProvider>
                </DisabledCSSVariableOverrideContextProvider>
              </DisabledAnnotationPillDisplayProvider>
            </DisabledScrollContainerProvider>
          </DeepLinkProvider>
        </DisabledThreadListContext>
      </MessageSeenObserverProvider>
    </GlobalElementProvider>
  );
}

function MessageContentInternal({
  content,
  attachments,
  edited,
}: Required<MessageContentReactComponentProps>) {
  const {
    byExternalID: { requestUsers, userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  useEffect(() => {
    requestUsers(...getReferencedUserIDs(content ?? []));
  }, [content, requestUsers]);

  const internalizedContent = useMemo(
    () => convertContent(content ?? [], userByID),
    [content, userByID],
  );

  return (
    <MessageContentImpl
      attachments={convertAttachments(attachments)}
      content={internalizedContent}
      edited={edited}
    />
  );
}

export default memo(MessageContent);

function convertAttachments(
  attachments: MessageAttachment[],
): MessageFragment['attachments'] {
  return attachments
    .filter((a) => a.type !== 'link_preview')
    .map((a) => ({
      __typename: 'MessageFileAttachment',
      id: '',
      file: {
        ...('screenshot' in a ? a.screenshot : a),
        __typename: 'File',
      },
    })) as MessageFragment['attachments'];
}

function convertContent(
  content: MessageContentType,
  userByID: (id: string) => UserFragment | undefined,
): MessageContentType {
  return content.map((node) => {
    if (node.type === MessageNodeType.MENTION) {
      const user = userByID(node.user.id);
      if (!user) {
        return node;
      }
      return {
        ...node,
        user: { id: user.id },
      };
    } else if ('children' in node) {
      return {
        ...node,
        children: convertContent(node.children, userByID),
      };
    } else {
      return node;
    }
  });
}
