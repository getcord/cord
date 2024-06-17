import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../common/ui/style.js';
import { cordifyClassname } from '../common/cordifyClassname.js';

const SHARE_TO_EMAIL_MENU_WIDTH = 190;
const SLACK_CHANNEL_SELECT_MENU_HEIGHT = 400;
const SLACK_CHANNEL_SELECT_MENU_WIDTH = 200;

export const optionsMenu = cordifyClassname('options-menu');

export const shareToEmailMenuContainer = cordifyClassname(
  'share-to-email-menu-container',
);
globalStyle(`:where(.${optionsMenu}) .${shareToEmailMenuContainer}`, {
  maxWidth: SHARE_TO_EMAIL_MENU_WIDTH,
});

export const slackChannelSelectMenuContainer = cordifyClassname(
  'slack-channel-menu-container',
);

globalStyle(`.${slackChannelSelectMenuContainer}`, {
  display: 'flex',
  maxHeight: SLACK_CHANNEL_SELECT_MENU_HEIGHT,
  maxWidth: SLACK_CHANNEL_SELECT_MENU_WIDTH,
});

defaultGlobalStyle(
  `:where(.cord-component-sidebar.${CORD_V2} .${optionsMenu}) .${slackChannelSelectMenuContainer}`,
  {
    overflow: 'hidden',
  },
);
