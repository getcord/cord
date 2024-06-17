import { globalStyle } from '../../../common/ui/style.js';
import { imageModalOverlay } from '../../../components/MediaModal.classnames.js';
import { messageVideoAttachments } from '../../../components/MessageContent.classnames.js';
import * as classes from '../../../components/message/MessageVideoAttachment.classnames.js';
export default classes;

const { videoAttachmentContainer } = classes;

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
