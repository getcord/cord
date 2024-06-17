import * as React from 'react';
import type { UUID, UploadedFile } from '@cord-sdk/types';
import classes from './MessageVideoAttachment.css.js';

type Props = {
  file: Pick<UploadedFile, 'id' | 'url'>;
  onUnsupportedFormat: (id: UUID) => unknown;
};

export function MessageVideoAttachment({ file, onUnsupportedFormat }: Props) {
  // NB: deliberately omit `type` even though we have a mime type to work around
  // Chrome thinking it can't play things that it can; see
  // https://secure.phabricator.com/T13135 and
  // https://github.com/phacility/phabricator/commit/5784e3d3c0cf817512023b3d797c03290ae26a8c.
  return (
    <video
      className={classes.videoAttachmentContainer}
      controls
      preload="metadata"
      data-cord-message-attachment-id={file.id}
    >
      <source src={file.url} onError={(_e) => onUnsupportedFormat(file.id)} />
    </video>
  );
}
