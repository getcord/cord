import { cordifyClassname } from '../../common/cordifyClassname.js';
import { MODIFIERS } from '../../common/ui/modifiers.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import { message } from '../../components/Message.classnames.js';
import { globalStyle } from '../../common/ui/style.js';

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
