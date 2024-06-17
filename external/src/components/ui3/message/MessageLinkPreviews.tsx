import cx from 'classnames';

import { XMarkIcon } from '@heroicons/react/20/solid';
import { useCallback } from 'react';
import * as classesAttachments from 'external/src/components/ui3/message/MessageFilesAttachments.css.ts';
import * as classes from 'external/src/components/ui3/message/MessageLinkPreviews.css.ts';
import { useHideLinkPreviewMutation } from 'external/src/graphql/operations.ts';
import type {
  MessageLinkPreviewFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  message: MessageFragment;
};

export function MessageLinkPreviews({ message }: Props) {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  const previews = message.attachments.filter(
    (attachment) => attachment.__typename === 'MessageLinkPreview',
  ) as MessageLinkPreviewFragment[];

  if (!previews || previews.length === 0) {
    return null;
  }

  const nonEmptyPreviews =
    previews && previews.filter((preview) => preview && preview.title);

  if (!nonEmptyPreviews) {
    return null;
  }

  const viewerIsAuthorOfMessage = isUserAuthorOfMessage(
    message,
    user?.externalID,
  );

  return (
    <div
      className={cx(
        classesAttachments.messageLinkPreviews,
        classesAttachments.messageAttachment,
      )}
    >
      {nonEmptyPreviews.map((preview, idx) => {
        if (!preview) {
          return null;
        }
        return (
          <MessageLinkPreview
            preview={preview}
            key={`${message.id}-${preview.url}-${idx}`}
            isViewerAuthor={viewerIsAuthorOfMessage}
          />
        );
      })}
    </div>
  );
}

function MessageLinkPreview({
  preview,
  isViewerAuthor,
}: {
  preview: MessageLinkPreviewFragment;
  isViewerAuthor: boolean;
}) {
  const [hideLinkPreview] = useHideLinkPreviewMutation();

  const onHideClick = useCallback(() => {
    void hideLinkPreview({ variables: { linkPreviewID: preview.id } });
  }, [hideLinkPreview, preview.id]);

  return (
    <div
      className={classes.linkPreviewWrapper}
      data-cord-message-attachment-id={preview.id}
    >
      {isViewerAuthor && (
        <XMarkIcon className={classes.linkPreviewHide} onClick={onHideClick} />
      )}
      <div className={classes.linkPreviewContainer}>
        <a
          href={preview.url}
          target="_blank"
          rel="noreferrer"
          className={classes.linkPreviewTitle}
        >
          {preview.title}
        </a>
        <p className={classes.linkPreviewDescription}>{preview.description}</p>
        <p className={classes.linkPreviewURL}>{preview.url}</p>
        {preview.img ? (
          <img src={preview.img} className={classes.linkPreviewImage} />
        ) : undefined}
      </div>
    </div>
  );
}
