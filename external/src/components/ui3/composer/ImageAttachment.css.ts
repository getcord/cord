import * as classes from 'external/src/components/ui3/composer/ImageAttachment.classnames.ts';
import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { message } from '@cord-sdk/react/components/Message.classnames.ts';
import { messageImageAttachments } from '@cord-sdk/react/components/MessageContent.classnames.ts';
export const {
  errorMessage,
  imageAttachment,
  imageAttachmentContainer,
  loading,
  loadingIcon,
  onHoverElement,
  overlay,
} = classes;

globalStyle(`.${imageAttachmentContainer}`, {
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('border-radius-medium'),
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
  maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
  maxHeight: `calc(${cssVar('space-xl')}*2)`,
});

globalStyle(`:where(.${message}) .${imageAttachmentContainer}`, {
  // Do not truncate image in a message content
  maxHeight: 'none',
});

globalStyle(`.${imageAttachmentContainer}:hover`, {
  boxShadow: cssVar('shadow-small'),
});
globalStyle(`.${imageAttachmentContainer}:where(.${MODIFIERS.error})`, {
  alignItems: 'center',
  color: cssVar('color-content-primary'),
  display: 'flex',
  gap: cssVar('space-3xs'),
  padding: cssVar('space-2xs'),
});

globalStyle(`:where(.${imageAttachmentContainer}) .${imageAttachment}`, {
  display: 'block',
  objectFit: 'cover',
  width: '100%',
});

globalStyle(`:where(.${imageAttachmentContainer}:hover) .${imageAttachment}`, {
  opacity: 0.5,
});

globalStyle(`:where(.${imageAttachmentContainer}) .${loadingIcon}`, {
  display: 'none',
});
globalStyle(`:where(.${imageAttachmentContainer}.${loading}) .${loadingIcon}`, {
  display: 'block',
});

globalStyle(`:where(.${imageAttachmentContainer}) .${onHoverElement}`, {
  display: 'none',
});

globalStyle(`:where(.${imageAttachmentContainer}:hover) .${onHoverElement}`, {
  opacity: 0.5,
  display: 'block',
});

globalStyle(`:where(.${imageAttachmentContainer}) .${overlay}`, {
  alignItems: 'center',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
});

/** Styles when used in other components  */
globalStyle(
  `:where(.${messageImageAttachments}) .${imageAttachmentContainer}`,
  {
    maxWidth: '100%',
    marginTop: cssVar('space-2xs'),
  },
);
