import { globalStyle } from 'common/ui/style.ts';

import { messageVideoAttachments } from '@cord-sdk/react/components/MessageContent.classnames.ts';
import { imageModalOverlay } from '@cord-sdk/react/components/MediaModal.classnames.ts';
import * as classes from '@cord-sdk/react/components/message/MessageVideoAttachment.classnames.ts';
export const { videoAttachmentContainer } = classes;

globalStyle(
  `:where(.${messageVideoAttachments}) .${videoAttachmentContainer}`,
  {
    maxHeight: '300px',
    maxWidth: '100%',
  },
);

globalStyle(`:where(.${imageModalOverlay}) .${videoAttachmentContainer}`, {
  maxHeight: '100%',
  maxWidth: '100%',
});
