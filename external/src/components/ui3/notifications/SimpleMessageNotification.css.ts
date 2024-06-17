import { cssVar } from 'common/ui/cssVariables.ts';
import { globalStyle } from 'common/ui/style.ts';
import { notificationMessage } from '@cord-sdk/react/components/Notification.classnames.ts';
export { notificationMessage };

globalStyle(`.${notificationMessage}`, {
  display: '-webkit-box',
  gridArea: 'content',
  overflow: 'hidden',
  // @ts-ignore this deprecated rule, it actually works.
  '-webkit-box-orient': 'vertical',
  '-webkit-line-clamp': '2',
});

// Increase specificity to override the normal StructuredMessage font
// colour.
// TODO: Move this to StructuredMessage when its converted to CSS.
globalStyle(`.${notificationMessage} p`, {
  color: cssVar('notification-content-text-color'),
});
