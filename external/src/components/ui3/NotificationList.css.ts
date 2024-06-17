import {
  cssVar,
  cssVarWithCustomFallback,
  CSS_VAR_CUSTOM_FALLBACKS,
} from 'common/ui/cssVariables.ts';
import {
  CORD_V1,
  cordifyClassname,
  globalStyle,
  defaultGlobalStyle,
} from 'common/ui/style.ts';

export const notificationList = cordifyClassname('notification-list-container');
globalStyle(`.${notificationList}`, {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  isolation: 'isolate',
  maxHeight: 'inherit',
  position: 'relative',
});

defaultGlobalStyle(
  `:where(.${CORD_V1}).cord-component-notification-list, :where(.${CORD_V1}.cord-component-notification-list-launcher) .${notificationList}`,
  {
    backgroundColor: cssVar('notification-list-background-color'),
    border: cssVar('notification-list-border'),
    borderRadius: cssVar('notification-list-border-radius'),
    boxShadow: cssVar('notification-list-box-shadow'),
    display: 'block',
    height: cssVar('notification-list-height'),
    width: cssVar('notification-list-width'),
    minWidth: '250px',
    overflow: 'hidden',
  },
);

defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-notification-list-launcher) .${notificationList}`,
  {
    display: 'flex',
    height: cssVarWithCustomFallback(
      'notification-list-height',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_NOTIFICATION_LIST.height,
    ),
    width: cssVarWithCustomFallback(
      'notification-list-width',
      CSS_VAR_CUSTOM_FALLBACKS.NESTED_NOTIFICATION_LIST.width,
    ),
    zIndex: cssVar('notification-list-launcher-list-z-index'),
  },
);

export const notificationListHeader = cordifyClassname(
  'notification-list-header',
);
globalStyle(`.${notificationListHeader}`, {
  display: 'flex',
  padding: cssVar('space-2xs'),
  paddingLeft: cssVar('space-m'),
  alignItems: 'center',
  color: cssVar('color-brand-primary'),
});

export const markAllAsRead = cordifyClassname('mark-all-as-read');
globalStyle(`.${markAllAsRead}`, {
  marginLeft: 'auto',
});
