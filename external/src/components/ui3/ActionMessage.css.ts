import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

import { message } from '@cord-sdk/react/components/Message.classnames.ts';

export const actionMessageIcon = cordifyClassname('action-message-icon');
globalStyle(`:where(.${message}.${MODIFIERS.action}) .${actionMessageIcon}`, {
  gridArea: 'icon',
});

export const actionMessageText = cordifyClassname('action-message-text');
globalStyle(`:where(.${message}.${MODIFIERS.action}) .${actionMessageText}`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: cssVar('color-content-primary'),
  gridArea: 'message',
});
