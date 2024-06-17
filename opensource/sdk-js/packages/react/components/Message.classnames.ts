import { cordifyClassname } from '../common/cordifyClassname.js';

export const message = cordifyClassname('message');
export const authorName = cordifyClassname('author-name');
export const messageContent = cordifyClassname('message-content');
export const optionsMenuTrigger = cordifyClassname('options-menu-trigger');
export const undoDeleteButton = cordifyClassname('undo-delete-button');
export const deletedMessageText = cordifyClassname('deleted-message-text');
export const deletedIcon = cordifyClassname('deleted-icon');
export const messageOptionsButtons = cordifyClassname(
  'message-options-buttons',
);

export const messageClassnamesDocs = {
  [message]:
    'Applied to the container div. You can use `grid-template-areas` to modify the layout of the message.',
  [authorName]:
    'Applied to the div containing the name of the author of the message.',
  [messageContent]:
    'Applied to the div containing the text of the message and any attachments.',
  [optionsMenuTrigger]:
    'Applied to the div which appears on hover on the top right of the message.',
  [deletedIcon]:
    'Applied to the div that contains the icon which appears when users delete a message.',
  [deletedMessageText]:
    'Applied to the div that contains the label that appears when users delete a message.',
  [undoDeleteButton]:
    'Applied to the "undo" button that appears when users delete a message.',
};
