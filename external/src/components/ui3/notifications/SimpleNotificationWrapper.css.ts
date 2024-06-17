import { CORD_V1, defaultGlobalStyle, globalStyle } from 'common/ui/style.ts';

import {
  notificationContainer,
  notificationIconContainer,
  notificationIcon,
  messageNotification,
  URLNotification,
} from '@cord-sdk/react/components/Notification.classnames.ts';
export {
  notificationContainer,
  notificationIconContainer,
  notificationIcon,
  messageNotification,
  URLNotification,
};

export const AVATAR_SIZE = 'l';

import { cssVar } from 'common/ui/cssVariables.ts';
import { getModifiedSelector, MODIFIERS } from 'common/ui/modifiers.ts';

globalStyle(`.${notificationContainer}`, {
  alignItems: 'start',
  cursor: 'pointer',
  display: 'grid',
  gridRowGap: cssVar('space-2xs'),
  gridTemplateRows: 'auto auto auto',
  gridTemplateColumns: 'auto 1fr auto',
  gridTemplateAreas: `
    "icon header   menu"
    ".     content   .   "
    ".     timestamp .   "

`,
  padding: cssVar('space-2xs'),
  paddingTop: cssVar('space-m'),
  textDecoration: 'none',
  position: 'relative',
});

globalStyle(`:where(.${notificationContainer}).${URLNotification}`, {
  gridTemplateAreas: `
  "icon header    menu"
  ".    timestamp .   "`,
  gridTemplateRows: 'auto auto',
});

defaultGlobalStyle(`:where(.${CORD_V1} .${notificationContainer})::before`, {
  backgroundColor: cssVar('color-base'),
  border: '1px none transparent',
  borderRadius: cssVar('border-radius-medium'),
  content: '',
  height: '100%',
  left: 0,
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  width: '100%',
  zIndex: -1,
});
defaultGlobalStyle(
  getModifiedSelector(
    'unseen',
    `:where(.${CORD_V1} .${notificationContainer})::before`,
  ),
  {
    backgroundColor: cssVar('color-notification'),
    opacity: 0.04,
  },
);

globalStyle(`:where(.${notificationContainer}) .${notificationIconContainer}`, {
  alignItems: 'center',
  display: 'flex',
  gap: cssVar('space-3xs'),
  paddingInlineStart: cssVar('space-xs'),
  paddingInlineEnd: cssVar('space-2xs'),
  position: 'relative',
});

defaultGlobalStyle(
  `:where(.${CORD_V1}) :where(.${notificationContainer}.${MODIFIERS.unseen}) .${notificationIconContainer}::before`,
  {
    backgroundColor: cssVar('color-notification'),
    borderRadius: '100%',
    content: '',
    height: cssVar('space-2xs'),
    insetInlineStart: 0,
    position: 'absolute',
    width: cssVar('space-2xs'),
  },
);

globalStyle(`:where(.${notificationContainer}) .${notificationIcon}`, {
  display: 'block',
  height: 20,
  objectFit: 'cover',
  width: 20,
});
