import { cordifyClassname } from '../common/cordifyClassname.js';

export const messageContent = cordifyClassname('message-content');
export const messageAttachment = cordifyClassname('message-attachment');
export const messageImageAttachments = cordifyClassname(
  'message-image-attachments',
);
export const messageVideoAttachments = cordifyClassname(
  'message-video-attachments',
);
export const messageDocumentAttachments = cordifyClassname(
  'message-document-attachments',
);
export const messageLinkPreviews = cordifyClassname('message-link-previews');
