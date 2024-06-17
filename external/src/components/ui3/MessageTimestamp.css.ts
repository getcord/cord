import { cssVar } from 'common/ui/cssVariables.ts';
import { MODIFIERS, getModifiedSelector } from 'common/ui/modifiers.ts';
import { CORD_V1, defaultGlobalStyle, globalStyle } from 'common/ui/style.ts';
import { timestamp } from 'external/src/components/ui3/MessageTimestamp.classnames.ts';
import { notificationContainer } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
export { timestamp };

globalStyle(`.${timestamp}`, {
  display: 'flex',
  marginTop: cssVar('space-3xs'),
  color: cssVar('color-content-secondary'),
  alignSelf: 'baseline',
});
defaultGlobalStyle(
  getModifiedSelector('unseen', ` :where(.${CORD_V1} .${timestamp})::after`),
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
defaultGlobalStyle(`:where(.cord-component-message.${CORD_V1}) .${timestamp}`, {
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
  `:where(.${CORD_V1}) :where(.${notificationContainer}) .${timestamp}::after`,
  {
    display: 'none', // Do not show unseen badge
  },
);
