import { MessageFilesAttachments2 } from 'external/src/components/2/MessageFilesAttachments2.tsx';
import { getSingleMessageAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { StructuredMessage2 } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import { MessageAnnotationElement2 } from 'external/src/components/chat/message/contentElements/MessageAnnotationElement2.tsx';
import { AnnotationPillDisplayContext } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import classes from 'external/src/components/2/MessageContentImpl.css.ts';
import type { MessageContent } from 'common/types/index.ts';
import { MessageLinkPreviews } from 'external/src/components/ui3/message/MessageLinkPreviews.tsx';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';

type MessageContentImplProps = {
  message?: MessageFragment;
  attachments: MessageFragment['attachments'];
  content: MessageContent;
  edited: boolean;
};

export function MessageContentImpl({
  message,
  attachments,
  content,
  edited,
}: MessageContentImplProps) {
  const annotationToShowBelowMessage = getSingleMessageAnnotation(attachments);
  const annotationPillDisplay = useContextThrowingIfNoProvider(
    AnnotationPillDisplayContext,
  );

  const hideAnnotationAttachment = annotationPillDisplay.hidden;
  const linkPreviewsEnabled = useFeatureFlag(FeatureFlags.SHOW_LINK_PREVIEWS);

  return (
    <div className={classes.messageContent}>
      <StructuredMessage2
        message={message}
        content={content}
        wasEdited={edited}
        // Hardcoding false here. This is an abstraction assumed by the StructuredMessage2 component,
        // which is not necessary for the current way editing state is implemented.
        // This will probably be fixed by the next iteration of the StructuredMessage component.
        isMessageBeingEdited={false}
        hideAnnotationAttachment={hideAnnotationAttachment}
      />
      <MessageFilesAttachments2 message={message} attachments={attachments} />
      {message && linkPreviewsEnabled && (
        <MessageLinkPreviews message={message} />
      )}
      {annotationToShowBelowMessage && !hideAnnotationAttachment && message && (
        <MessageAnnotationElement2
          annotationAttachmentID={annotationToShowBelowMessage.id}
          message={message}
        />
      )}
    </div>
  );
}
