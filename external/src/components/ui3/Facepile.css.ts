import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import * as classes from 'external/src/components/ui3/Facepile.classnames.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';
import { typing } from '@cord-sdk/react/components/Thread.classnames.ts';
import { emptyStatePlaceholderContainer } from '@cord-sdk/react/components//helpers/EmptyStateWithFacepile.classnames.ts';
export default classes;

const { facepileContainer, otherUsers, otherUsersPlaceholder } = classes;

/**
 * Base styles
 */
globalStyle(`.${facepileContainer}`, {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  isolation: 'isolate',
  position: 'relative',
});

globalStyle(`.${otherUsers}`, {
  alignItems: 'center',
  alignSelf: 'stretch',
  color: cssVar('color-content-primary'),
  cursor: 'default',
  display: 'flex',
  paddingLeft: cssVar('facepile-avatar-border-width'),
});
globalStyle(`:where(.${otherUsers}):hover`, {
  color: cssVar('color-content-emphasis'),
});

/**
 * Facepile styles when used in other components
 */
globalStyle(`:where(.${facepileContainer}) .${otherUsersPlaceholder}`, {
  backgroundColor: cssVar('color-content-emphasis'),
  borderRadius: cssVar('avatar-border-radius'),
  color: cssVar('color-base'),
  display: 'flex',
  justifyContent: 'center',
  marginLeft: `calc(${cssVar('facepile-avatar-border-width')} * -1)`,
});
globalStyle(
  `:where(.${cordifyClassname(
    'collapsed-thread-footer',
  )}) .${otherUsersPlaceholder}`,
  {
    height: cssVar('space-m'),
    width: cssVar('space-m'),
  },
);

globalStyle(getModifiedSelector('extraLarge', `.${otherUsersPlaceholder}`), {
  width: cssVar('space-xl'),
});
globalStyle(getModifiedSelector('large', `.${otherUsersPlaceholder}`), {
  width: cssVar('space-l'),
});
globalStyle(getModifiedSelector('medium', `.${otherUsersPlaceholder}`), {
  width: cssVar('space-m'),
});

globalStyle(
  `:where(.${emptyStatePlaceholderContainer}) .${facepileContainer}`,
  {
    marginBottom: cssVar('space-m'),
  },
);

globalStyle(`:where(.${typing}) .${facepileContainer}`, {
  minWidth: '20px',
});

export const facepileClassnamesDocs = {
  [facepileContainer]:
    'Applied to the container div. This class is always present.',
};

const commonClasses = {
  ...facepileClassnamesDocs,
  [otherUsers]: `Applied to the "+N" indicator, which is shown after the faces to indicate how many avatars are not being shown.`,
};

export const pagePresenceClassnamesDocs = {
  ...commonClasses,
};

export const presenceFacepileClassnamesDocs = {
  ...commonClasses,
};
