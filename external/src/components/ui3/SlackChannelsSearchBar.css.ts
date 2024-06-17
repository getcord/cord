import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';

export const slackChannelsSearchBar = cordifyClassname(
  'slack-channels-search-bar',
);
globalStyle(`.${slackChannelsSearchBar}`, {
  display: 'flex',
  padding: cssVar('space-xs'),
  marginBottom: cssVar('space-2xs'),
  backgroundColor: cssVar('color-base-strong'),
  borderRadius: cssVar('space-3xs'),
});

export const slackChannelsSearchBarIcon = cordifyClassname(
  'slack-channels-search-bar-icon',
);
globalStyle(
  `:where(.${slackChannelsSearchBar}) .${slackChannelsSearchBarIcon}`,
  {
    color: cssVar('color-content-secondary'),
  },
);

export const slackChannelsSearchBarInput = cordifyClassname(
  'slack-channels-search-bar-input',
);
globalStyle(
  `:where(.${slackChannelsSearchBar}) .${slackChannelsSearchBarInput}`,
  {
    border: 'none',
    background: cssVar('color-base-strong'),
    color: cssVar('color-content-primary'),
    marginLeft: cssVar('space-2xs'),
    width: '100%',
    filter: 'opacity(90%)',
  },
);

globalStyle(
  `:where(.${slackChannelsSearchBar}) .${slackChannelsSearchBarInput}:focus-visible`,
  {
    outline: 'none',
  },
);
