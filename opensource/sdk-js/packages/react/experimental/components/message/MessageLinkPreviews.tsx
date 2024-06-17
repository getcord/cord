import React, { forwardRef, useCallback } from 'react';
import type {
  ClientUserData,
  MessageLinkPreviewAttachment,
} from '@cord-sdk/types';
import cx from 'classnames';

import { useViewerData } from '../../../hooks/user.js';
import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import type { StyleProps } from '../../../betaV2.js';
import classes from './MessageLinkPreviews.css.js';
import { MessageLinkPreview } from './MessageLinkPreview.js';

export type MessageLinkPreviewsProps = {
  linkPreviews: MessageLinkPreviewAttachment[];
  authorData: ClientUserData | null | undefined;
  messageID: string;
} & MandatoryReplaceableProps &
  StyleProps;

export const MessageLinkPreviews = withCord<
  React.PropsWithChildren<MessageLinkPreviewsProps>
>(
  forwardRef(function MessageLinkPreviews(
    {
      linkPreviews,
      className,
      authorData,
      messageID,
      ...restProps
    }: MessageLinkPreviewsProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const viewer = useViewerData();

    const removeLinkPreview = useCallback(
      (previewID: string) => {
        void window.CordSDK?.thread.updateMessage(messageID, {
          removeAttachments: [{ type: 'link_preview', id: previewID }],
        });
      },
      [messageID],
    );

    if (!linkPreviews || linkPreviews.length === 0) {
      return null;
    }

    const nonEmptyPreviews =
      linkPreviews &&
      linkPreviews.filter((preview) => preview && preview.title);

    if (!nonEmptyPreviews || nonEmptyPreviews.length === 0) {
      return null;
    }

    const viewerIsAuthorOfMessage =
      (viewer && authorData && viewer?.id === authorData?.id) ?? false;

    return (
      <div
        className={cx(
          className,
          classes.messageLinkPreviews,
          classes.messageAttachment,
        )}
        ref={ref}
        {...restProps}
      >
        {nonEmptyPreviews.map((preview) => {
          return (
            <MessageLinkPreview
              canBeReplaced
              preview={preview}
              key={preview.id}
              isViewerAuthor={viewerIsAuthorOfMessage}
              removeLinkPreview={removeLinkPreview}
            />
          );
        })}
      </div>
    );
  }),
  'MessageLinkPreviews',
);
