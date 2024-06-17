/**
 * This CSS exists to support clients on old version of the SDK.
 * Specifically, on version before Cord 4.0 CSS was versioned.
 */
import * as classes from '@cord-sdk/react/components/ThreadedComments.classnames.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { CSSProperties } from 'common/ui/style.ts';
import { cordifyClassname, defaultGlobalStyle } from 'common/ui/style.ts';
import { MODIFIERS, getModifiedSelector } from 'common/ui/modifiers.ts';
import {
  CORD_V2,
  backwardsCompatibleGlobalStyle,
} from 'sdk/client/core/css/backwardsCompatibleStyle.ts';

const {
  comments,
  tabContainer,
  tab,
  threadList,
  thread,
  resolvedThreadHeader,
  expandResolvedButton,
  reopenButton,
  expandReplies,
  repliesContainer,
  hideReplies,
  showMore,
  viewerAvatarWithComposer,
} = classes;

defaultGlobalStyle(`:where(.${comments}):not(.${CORD_V2})`, {
  position: 'relative', // Make sure toasts appear inside `comments`
  width: '320px',
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  padding: cssVar('space-2xs'),
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space-2xs'),
  backgroundColor: cssVar('color-base'),
});

backwardsCompatibleGlobalStyle(`.${threadList}`, {
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space-2xs'),
  height: 'auto',

  // Setting the color of the thumb of the scrollbar and the track respectively
  // In Firefox the scrollbar will overlap with the options menu. Having the track
  // to be transparent makes clicking the options menu slightly easier.
  scrollbarColor: `${cssVar('color-base-x-strong')} transparent`,
});

// MacOS hides scrollbars when we are not scrolling, which
// then makes them overlap with the options menu when we do scroll.
// We are explicitly setting styles to avoid this overlap.

// By setting a fixed width, we are ensuring that
// the scrollbar is always present
defaultGlobalStyle(
  `:where(.${comments}):not(.${CORD_V2}) .${threadList}::-webkit-scrollbar`,
  {
    width: '10px',
  },
);

defaultGlobalStyle(
  `:where(.${comments}):not(.${CORD_V2}) .${threadList}::-webkit-scrollbar-thumb`,
  {
    backgroundColor: cssVar('color-base-x-strong'),
    borderRadius: cssVar('border-radius-large'),
    // Preventing the scrollbar thumb from becoming too small
    minHeight: '28px',
  },
);

backwardsCompatibleGlobalStyle(`.${thread}`, {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: cssVar('space-3xs'),
});

backwardsCompatibleGlobalStyle(`.${resolvedThreadHeader}`, {
  alignItems: 'center',
  color: cssVar('color-content-primary'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  padding: `0 ${cssVar('space-3xs')} 0 ${cssVar('space-2xs')}`,
});

backwardsCompatibleGlobalStyle(`.${reopenButton}`, {
  border: 'none',
  borderRadius: cssVar('space-3xs'),
  cursor: 'pointer',
  marginLeft: 'auto',
  padding: `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
  pointerEvents: 'none',
  visibility: 'hidden',
});

backwardsCompatibleGlobalStyle(`.${reopenButton}:hover`, {
  backgroundColor: cssVar('color-base-x-strong'),
});

backwardsCompatibleGlobalStyle(
  `:where(.${resolvedThreadHeader}):hover .${reopenButton}`,
  {
    pointerEvents: 'auto',
    visibility: 'visible',
  },
);

backwardsCompatibleGlobalStyle(getModifiedSelector('resolved', `.${thread}`), {
  backgroundColor: cssVar('color-base-strong'),
  margin: `0 ${cssVar('space-3xs')} 0 ${cssVar('space-2xs')}`,
  padding: `${cssVar('space-2xs')} 0`,
});

backwardsCompatibleGlobalStyle(`.${tabContainer}`, {
  backgroundColor: cssVar('color-base-strong'),
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  margin: cssVar('space-2xs'),
  padding: cssVar('space-3xs'),
});

backwardsCompatibleGlobalStyle(`.${tab}`, {
  backgroundColor: 'unset',
  border: 'none',
  borderRadius: cssVar('space-3xs'),
  flexGrow: 1,
  flexBasis: 0,
  padding: cssVar('space-3xs'),
  color: 'inherit',
});

backwardsCompatibleGlobalStyle(`.${tab}:hover`, {
  color: 'inherit',
  backgroundColor: cssVar('color-base-x-strong'),
  cursor: 'pointer',
});

backwardsCompatibleGlobalStyle(getModifiedSelector('active', `.${tab}`), {
  backgroundColor: cssVar('color-base'),
});

backwardsCompatibleGlobalStyle(getModifiedSelector('active', `.${tab}:hover`), {
  backgroundColor: cssVar('color-base'),
  cursor: 'unset',
});

backwardsCompatibleGlobalStyle(
  getModifiedSelector('highlighted', `.${thread}`),
  {
    backgroundColor: cssVar('color-base-strong'),
  },
);

backwardsCompatibleGlobalStyle(
  getModifiedSelector(['resolved', 'highlighted'], `.${thread}`),
  {
    backgroundColor: cssVar('color-base-x-strong'),
  },
);

// TODO Move this style to ui3/Pill when that's available, and reduce its specificity
backwardsCompatibleGlobalStyle(
  getModifiedSelector('highlighted', `.${thread} .${cordifyClassname('pill')}`),
  {
    backgroundColor: cssVar('color-base-x-strong'),
  },
);

const threadOrThreadListButton = [
  `.${threadList} > button`,
  `.${thread} > button`,
];
backwardsCompatibleGlobalStyle(threadOrThreadListButton.join(', '), {
  alignItems: 'center',
  background: 'none',
  border: 'none',
  borderRadius: cssVar('space-3xs'),
  cursor: 'pointer',
  display: 'flex',
  gap: cssVar('space-2xs'),
  textAlign: 'left',
  margin: `0 ${cssVar('space-3xs')} 0 ${cssVar('space-2xs')}`,
});
backwardsCompatibleGlobalStyle(
  threadOrThreadListButton.map((s) => s + ':hover').join(', '),
  {
    background: cssVar('color-base-strong'),
  },
);

backwardsCompatibleGlobalStyle(`.${expandResolvedButton}`, {
  background: 'none',
  border: 'none',
  color: cssVar('color-content-emphasis'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  paddingLeft: `calc(${cssVar('space-l')} + ${cssVar('space-2xs')})`,
});

backwardsCompatibleGlobalStyle(`.${expandResolvedButton}:hover`, {
  background: 'none',
  cursor: 'pointer',
  textDecoration: 'underline',
});

backwardsCompatibleGlobalStyle(`button.${expandReplies}`, {
  padding: `${cssVar('space-2xs')} calc(${cssVar('space-l')} + ${cssVar(
    'space-2xs',
  )})`,
  color: cssVar('color-brand-primary'),
  '--cord-facepile-avatar-size': cssVar('space-m'),
} as CSSProperties);

backwardsCompatibleGlobalStyle(MODIFIERS.unseen, {
  color: cssVar('color-notification'),
});
backwardsCompatibleGlobalStyle(`.${MODIFIERS.unseen}:hover`, {
  backgroundColor: cssVar('color-notification-background'),
});

backwardsCompatibleGlobalStyle(`.cord-component-facepile`, {
  display: 'contents',
  lineHeight: cssVar('line-height-body'),
});
defaultGlobalStyle(
  `:where(.${comments}):not(.${CORD_V2}) :where(.${MODIFIERS.unseen} .cord-component-facepile)::before`,
  {
    background: cssVar('color-notification'),
    borderRadius: '50%',
    content: '',
    height: '8px',
    marginLeft: '-18px',
    width: '8px',
  },
);

backwardsCompatibleGlobalStyle(`.${repliesContainer}`, {
  marginLeft: cssVar('space-l'),
  paddingLeft: cssVar('space-2xs'),
  display: 'flex',
  flexDirection: 'column',
});

backwardsCompatibleGlobalStyle(`button.${hideReplies}`, {
  color: cssVar('color-content-primary'),
  padding: cssVar('space-2xs'),
  paddingLeft: `calc(${cssVar('space-l')} + ${cssVar('space-2xs')})`,
});

backwardsCompatibleGlobalStyle(`button.${showMore}`, {
  color: cssVar('color-content-primary'),
  padding: cssVar('space-2xs'),
  marginLeft: cssVar('space-2xs'),
});
defaultGlobalStyle(
  `:where(.${comments}):not(.${CORD_V2}) :where(button.${showMore})::before`,
  {
    display: 'block',
    content: '',
    // We need to hardcode the width of the horizontal line to make
    // sure that the "Show more" text correctly aligns
    width: '10px',
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
  },
);
defaultGlobalStyle(
  `:where(.${comments}):not(.${CORD_V2}) :where(button.${showMore})::after`,
  {
    display: 'block',
    content: '',
    flexGrow: 1,
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
  },
);

backwardsCompatibleGlobalStyle(`.cord-component-composer`, {
  flexGrow: '1',
});

backwardsCompatibleGlobalStyle(`.${viewerAvatarWithComposer}`, {
  display: 'flex',
  gap: cssVar('space-2xs'),
  padding: `${cssVar('space-2xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')}`,
  marginLeft: `calc(${cssVar('space-l')} + ${cssVar('space-2xs')})`,
});

backwardsCompatibleGlobalStyle(
  `.${viewerAvatarWithComposer} > .cord-component-avatar`,
  {
    marginTop: '10px',
    '--cord-facepile-avatar-size': cssVar('space-l'),
  } as CSSProperties,
);
