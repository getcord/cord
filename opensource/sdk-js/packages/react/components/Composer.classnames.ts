import { cordifyClassname } from '../common/cordifyClassname.js';

// To avoid circular dependencies between various composer css files we put the classes here.

export const composerContainer = cordifyClassname('composer');
export const large = cordifyClassname('large');
export const medium = cordifyClassname('medium');
export const small = cordifyClassname('small');
export const empty = cordifyClassname('empty');
export const valid = cordifyClassname('valid');
export const alwaysExpand = cordifyClassname('always-expand');
export const neverExpand = cordifyClassname('never-expand');
export const autoExpand = cordifyClassname('auto-expand');
export const primaryButtonsGroup = cordifyClassname('composer-primary-buttons');
export const secondaryButtonsGroup = cordifyClassname(
  'composer-secondary-buttons',
);
export const composerErrorMessage = cordifyClassname('composer-error-message');

export const editorContainer = cordifyClassname('editor-container');
export const editor = cordifyClassname('editor');

export const userReferenceSuggestionsMenu = cordifyClassname('mention-menu');

export const attachmentsContainer = cordifyClassname('attachments');
export const hasAttachments = cordifyClassname('has-attachments');
export const collapsedComposerSelector = `.${composerContainer}:not(.${hasAttachments}):is(.${neverExpand}, .${autoExpand}:not(:focus-within))`;

export const composerClassnamesDocs = {
  [composerContainer]:
    'Applied to the container div. This class is always present.',
  [empty]: 'Applied to the container div when the text editor is empty',
  [valid]:
    'Applied to the container div when the message is valid and can be sent. This means there either some non-whitespace text, or at least one attachment.',
  [alwaysExpand]:
    'Applied to the container div, reflects the composer `expanded` prop.',
  [neverExpand]:
    'Applied to the container div, reflects the composer `expanded` prop.',
  [autoExpand]:
    'Applied to the container div, reflects the composer `expanded` prop.',
  [editorContainer]: 'Applied to the div containing the editor.',
  [attachmentsContainer]:
    'Applied to the div containing the attachments (files and images).',
  [composerErrorMessage]:
    'Applied to the div containing the error message that appears when a message fails to send',
};
