import { cssVar } from 'common/ui/cssVariables.ts';

import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { message } from 'external/src/components/2/MessageImpl.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

export const messageOptionsButtons = cordifyClassname(
  'message-options-buttons',
);
globalStyle(`.${messageOptionsButtons}`, {
  display: 'flex',
  gap: cssVar('space-3xs'),
  background: 'transparent',
  borderRadius: cssVar('space-3xs'),
  paddingTop: cssVar('space-3xs'),
});
globalStyle(`:where(.${message}) .${messageOptionsButtons}`, {
  paddingTop: '0px',
  flexDirection: 'column',
  pointerEvents: 'none',
  visibility: 'hidden',
});
globalStyle(`:where(.${message}):hover .${messageOptionsButtons}`, {
  visibility: 'visible',
  pointerEvents: 'auto',
});

globalStyle(`.${message} :where(.${messageOptionsButtons}.${MODIFIERS.open})`, {
  // Never hide the menu and its contents if the popper is open.
  visibility: 'visible',
});
