import React, { useCallback, forwardRef } from 'react';
import type { MessageLinkPreviewAttachment } from '@cord-sdk/types';
import cx from 'classnames';

import withCord from '../hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import { Button } from '../../../betaV2.js';
import type { StyleProps } from '../../../betaV2.js';
import classes from './MessageLinkPreview.css.js';

export type MessageLinkPreviewProps = {
  preview: MessageLinkPreviewAttachment;
  isViewerAuthor: boolean;
  removeLinkPreview: (previewID: string) => void;
} & MandatoryReplaceableProps &
  StyleProps;

export const MessageLinkPreview = withCord<
  React.PropsWithChildren<MessageLinkPreviewProps>
>(
  forwardRef(function MessageLinkPreview(
    {
      preview,
      isViewerAuthor,
      className,
      removeLinkPreview,
      ...restProps
    }: MessageLinkPreviewProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const onRemoveClick = useCallback(
      () => removeLinkPreview(preview.id),
      [removeLinkPreview, preview.id],
    );

    return (
      <div
        className={cx(className, classes.linkPreviewContainer)}
        ref={ref}
        {...restProps}
      >
        {isViewerAuthor && (
          <Button
            canBeReplaced
            buttonAction="remove-link-preview"
            icon="Cross"
            className={classes.linkPreviewHide}
            onClick={onRemoveClick}
          />
        )}
        <div className={classes.linkPreview}>
          <a
            href={preview.url}
            target="_blank"
            rel="noreferrer"
            className={classes.linkPreviewTitle}
          >
            {preview.title}
          </a>
          <p className={classes.linkPreviewDescription}>
            {preview.description}
          </p>
          <p className={classes.linkPreviewURL}>{preview.url}</p>
          {preview.imageURL && (
            <img src={preview.imageURL} className={classes.linkPreviewImage} />
          )}
        </div>
      </div>
    );
  }),
  'MessageLinkPreview',
);
