import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../common/ui/style.js';
import { cssVar } from '../common/ui/cssVariables.js';
import { getModifiedSelector, MODIFIERS } from '../common/ui/modifiers.js';
import { message } from './Message.classnames.js';
import { timestamp } from './Timestamp.classnames.js';
export { timestamp };
import { notificationContainer } from './Notification.classnames.js';

globalStyle(`.${timestamp}`, {
  display: 'flex',
  marginTop: cssVar('space-3xs'),
  color: cssVar('color-content-secondary'),
  alignSelf: 'baseline',
});
defaultGlobalStyle(
  getModifiedSelector('unseen', ` :where(.${CORD_V2} .${timestamp})::after`),
  {
    background: cssVar('notification-unread-badge-color'),
    content: '',
    height: '8px',
    width: '8px',
    borderRadius: '50%',
    marginLeft: cssVar('space-3xs'),
    marginTop: cssVar('space-3xs'),
  },
);

/** Styles when used inside other components */
globalStyle(`.${message} .${timestamp}`, {
  gridArea: 'timestamp',
});

globalStyle(`:where(.${notificationContainer}) .${timestamp}`, {
  color: cssVar('color-content-secondary'),
  gridArea: 'timestamp',
});

globalStyle(
  `:where(.${notificationContainer}.${MODIFIERS.unseen}) .${timestamp}`,
  {
    color: cssVar('color-notification'),
    fontWeight: cssVar('font-weight-bold'),
  },
);

globalStyle(`:where(.${notificationContainer}) .${timestamp}`, {
  marginTop: 0,
});
defaultGlobalStyle(
  `:where(.${CORD_V2}) :where(.${notificationContainer}) .${timestamp}::after`,
  {
    display: 'none', // Do not show unseen badge
  },
);
