import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';

export const slackChannelsContainer = cordifyClassname(
  'slack-channels-container',
);
globalStyle(`.${slackChannelsContainer}`, {
  overflow: 'auto',
  flex: 1,
  paddingBottom: cssVar('space-3xs'),
});

export const noChannelsText = cordifyClassname('no-channels-text');
globalStyle(`:where(.${slackChannelsContainer}) .${noChannelsText}`, {
  paddingTop: cssVar('space-xl'),
  paddingBottom: cssVar('space-xl'),
  color: cssVar('color-content-secondary'),
  textAlign: 'center',
});
