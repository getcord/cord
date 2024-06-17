import {
  CORD_V1,
  cordifyClassname,
  defaultGlobalStyle,
  globalStyle,
} from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { getModifiedSelector } from '@cord-sdk/react/common/ui/modifiers.ts';
import { facepileContainer } from '@cord-sdk/react/components/Facepile.classnames.ts';
import { pinContainer } from '@cord-sdk/react/components/Pin.classnames.ts';
import { threadFooterContainer } from '@cord-sdk/react/components/Thread.classnames.ts';
import { emptyStatePlaceholderContainer } from '@cord-sdk/react/components/helpers/EmptyStateWithFacepile.classnames.ts';
import { base as menuItemBase } from 'external/src/components/ui3/MenuItem.classnames.js';
import * as classes from 'external/src/components/ui3/Avatar.classnames.js';
import { label } from 'sdk/client/core/css/LiveCursors-backwards-compatible.css.ts';
export default classes;

const { avatarContainer, avatarFallback, avatarImage } = classes;

globalStyle(`.${avatarContainer}`, {
  borderRadius: cssVar('avatar-border-radius'),
  cursor: 'default',
  height: '20px',
  overflow: 'hidden',
  width: '20px',
});
globalStyle(`:where(.${threadFooterContainer}) .${avatarContainer}`, {
  height: cssVar('space-m'),
  width: cssVar('space-m'),
});
globalStyle(
  `:where(.${cordifyClassname(
    'annotation-pointer-container',
  )}) .${avatarContainer}`,
  {
    height: `calc(${cssVar('annotation-pin-size')} * 0.8)`,
    width: `calc(${cssVar('annotation-pin-size')} * 0.8)`,
  },
);
defaultGlobalStyle(
  `:where(:host(cord-settings), .cord-component-settings.${CORD_V1}) .${avatarContainer}`,
  {
    height: cssVar('space-4xl'),
    width: cssVar('space-4xl'),
  },
);
// TODO: Remove :host when we get rid of shadowRoot forever
globalStyle(`:host(cord-message) .${avatarContainer}`, {
  gridArea: 'avatar',
  marginTop: cssVar('space-3xs'),
});
defaultGlobalStyle(`cord-message:where(.${CORD_V1}) .${avatarContainer}`, {
  gridArea: 'avatar',
  marginTop: cssVar('space-3xs'),
});
globalStyle(`:where(.${pinContainer}) .${avatarContainer}`, {
  position: 'absolute',
  borderRadius: '50%',
  height: `calc(${cssVar('annotation-pin-size')} * 0.7)`,
  width: `calc(${cssVar('annotation-pin-size')} * 0.7)`,
});
globalStyle(`:where(.${pinContainer}) .${avatarFallback}`, {
  fontSize: `calc(${cssVar('annotation-pin-size')} * 0.8 * 0.5 )`,
});
defaultGlobalStyle(
  `:where(.${CORD_V1}):where(.cord-component-avatar, .cord-component-facepile, .cord-component-presence-facepile) .${avatarContainer}`,
  {
    height: cssVar('facepile-avatar-size'),
    width: cssVar('facepile-avatar-size'),
  },
);
defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-page-presence) .${avatarContainer}`,
  {
    height: cssVar('page-presence-avatar-size'),
    width: cssVar('page-presence-avatar-size'),
  },
);
globalStyle(getModifiedSelector('loading', `.${avatarContainer}`), {
  visibility: 'hidden',
});
globalStyle(`:where(.${facepileContainer}) .${avatarContainer}`, {
  display: 'flex',
  // boxShadow is used to achieve the overlap + crop effect.
  boxShadow: ` ${cssVar('facepile-avatar-border-width')} 0 0 ${cssVar(
    'facepile-background-color',
  )}`,
  position: 'relative',
});
globalStyle(`.${facepileContainer} > :where(.${avatarContainer}:last-child)`, {
  boxShadow: 'none',
});

globalStyle(
  `.${facepileContainer} > :where(.${avatarContainer}:not(:first-child))`,
  {
    marginLeft: `calc(${cssVar('facepile-avatar-overlap')} * -1)`,
  },
);
// This is needed for the "cutout" effect of our overlapping avatars.
// Specifically, since we set opacity 0.5 to "non present" users, we
// need a solid white background to avoid semi-transparent avatars getting mixed.
defaultGlobalStyle(
  `:where(.${CORD_V1}) :where(.${facepileContainer}) .${avatarContainer}::after`,
  {
    content: '',
    width: '100%',
    height: '100%',
    background: cssVar('facepile-background-color'),
    display: 'block',
    position: 'absolute',
    zIndex: '-1',
  },
);
const AVATAR_MAX_ZINDEX = 20;
// Our facepile has overlapping Avatars. We need zIndex to achieve
// the nice overlap + crop effect. We use a class rather than inline
// styles because it's easier for devs to override.
for (let i = 1; i < AVATAR_MAX_ZINDEX; i++) {
  globalStyle(
    `.${facepileContainer} > :where(.${avatarContainer}:nth-child(${i}))`,
    {
      position: 'relative', // Allow zIndex, needed because we overlap avatars
      zIndex: AVATAR_MAX_ZINDEX - i,
    },
  );
}

globalStyle(`.${avatarFallback}`, {
  alignItems: 'center',
  background: 'black',
  color: 'white',
  display: 'flex',
  height: 'inherit',
  justifyContent: 'center',
  width: 'inherit',
});
globalStyle(
  `:where(.${cordifyClassname(
    'annotation-pointer-container',
  )}) .${avatarFallback}`,
  {
    fontSize: `calc(${cssVar('annotation-pin-size')} * 0.8 * 0.5 )`,
  },
);
globalStyle(getModifiedSelector('notPresent', ` .${avatarFallback}`), {
  opacity: 0.5,
});
globalStyle(getModifiedSelector('present', ` .${avatarFallback}`), {
  opacity: 1,
});

globalStyle(
  `:not(${getModifiedSelector(
    'error',
    `.${avatarContainer}`,
  )}) .${avatarImage}`,
  {
    display: 'block',
    objectFit: 'cover',
    width: '100%',
  },
);
globalStyle(
  getModifiedSelector('error', `.${avatarContainer} .${avatarImage}`),
  {
    display: 'none',
  },
);
globalStyle(getModifiedSelector('notPresent', ` .${avatarImage}`), {
  opacity: 0.5,
});
globalStyle(getModifiedSelector('present', ` .${avatarImage}`), {
  opacity: 1,
});

/**
 * Avatar styles when used in other components
 */

globalStyle(`:where(.${emptyStatePlaceholderContainer}) .${avatarContainer}`, {
  height: cssVar('space-xl'),
  width: cssVar('space-xl'),
});

// Avatars in mention menu - we want to make sure the avatar doesn't shrink if
// the display names are long
globalStyle(`:where(.${menuItemBase}) .${avatarContainer}`, {
  flexShrink: 0,
});

globalStyle(`.${label} .${avatarContainer}`, {
  height: cssVar('space-xl'),
  width: cssVar('space-xl'),
  borderRadius: cssVar('space-xl'),

  // Negative margin to pull the avatar a little more towards the left since
  // it's rounded, but to let the label still look good/centered if there is no
  // avatar.
  marginLeft: '-6px',
});
