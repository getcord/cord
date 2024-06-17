import { globalStyle } from 'common/ui/style.ts';
import { editorStyles } from 'common/ui/editorStyles.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import {
  notificationHeaderBold,
  notificationHeaderContainer,
  notificationHeaderText,
  notificationHeaderUserMention,
} from '@cord-sdk/react/components/Notification.classnames.ts';
export {
  notificationHeaderBold,
  notificationHeaderContainer,
  notificationHeaderText,
  notificationHeaderUserMention,
} from '@cord-sdk/react/components/Notification.classnames.ts';

globalStyle(`.${notificationHeaderContainer}`, {
  ...editorStyles,
  // Needed for -webkit-line-clamp to work
  display: '-webkit-box',
  gap: cssVar('space-3xs'),
  overflow: 'hidden',
  // Needed for -webkit-line-clamp to work
  // @ts-ignore clamping magic
  '-webkit-box-orient': 'vertical',
  // Supported on latest versions of Chrome, Edge, Safari, FF and Opera.
  // '2' as a string or it it will become 2px!
  '-webkit-line-clamp': '2',
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  fontWeight: cssVar('font-weight-regular'),
  lineHeight: cssVar('line-height-body'),
  gridArea: 'header',
});

globalStyle(
  `:where(.${notificationHeaderContainer}) .${notificationHeaderText}`,
  {
    color: cssVar('notification-header-text-color'),
  },
);

globalStyle(
  `.${notificationHeaderContainer} :where(.${notificationHeaderUserMention}, .${notificationHeaderBold})`,
  {
    color: cssVar('notification-header-emphasis-text-color'),
    fontWeight: cssVar('font-weight-bold'),
  },
);
