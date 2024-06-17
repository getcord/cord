import { cordifyClassname } from 'common/ui/style.ts';

// To avoid circular dependencies between various composer css files we put the classes here.

export const composerContainer = cordifyClassname('composer');
export const large = cordifyClassname('large');
export const medium = cordifyClassname('medium');
export const small = cordifyClassname('small');
export const empty = cordifyClassname('empty');
export const valid = cordifyClassname('valid');
export const expanded = cordifyClassname('expanded');
export const composerButtonsContainer = cordifyClassname('composer-menu');
export const primaryButtonsGroup = cordifyClassname('composer-primary-buttons');
export const secondaryButtonsGroup = cordifyClassname(
  'composer-secondary-buttons',
);
export const composerErrorMessage = cordifyClassname('composer-error-message');

export const editorContainer = cordifyClassname('editor-container');
export const editor = cordifyClassname('editor');
export const editorSlot = cordifyClassname('editor-slot');
export const placeholder = cordifyClassname('placeholder');

export const userReferenceSuggestionsMenu = cordifyClassname('mention-menu');

export const attachmentsContainer = cordifyClassname('attachments');

export const composerClassnamesDocs = {
  [composerContainer]:
    'Applied to the container div. This class is always present.',
  [expanded]:
    'Applied to the container div when the composer is expanded, usually on focus, or when some text is already there.',
  [editorContainer]: 'Applied to the div containing the editor.',
  [composerButtonsContainer]:
    'Applied to the div containing the primary and secondary buttons.',
  [placeholder]: 'Applied to the typing placeholder.',
  [attachmentsContainer]:
    'Applied to the div containing the attachments (files and images).',
  [composerErrorMessage]:
    'Applied to the div containing the error message that appears when a message fails to send',
};
