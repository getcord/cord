import { globalStyle, internalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import { inlineThread } from '@cord-sdk/react/components/Thread.classnames.ts';
import * as classes from 'external/src/components/ui3/composer/Composer.classnames.ts';
import { Colors } from 'common/const/Colors.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';

export default classes;

const { composerContainer, expanded, composerErrorMessage } = classes;

globalStyle(`.${composerContainer}`, {
  backgroundColor: cssVar('color-base'),
  border: cssVar('composer-border'),
  borderRadius: cssVar('composer-border-radius'),
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: cssVar('space-2xs'),
  paddingBottom: cssVar('space-2xs'),
  paddingTop: cssVar('space-2xs'),
  // A flex/grid item min size is auto,
  // but we need the composer to be able to shrink smaller than its content.
  // This avoids the composer becoming giant and overflowing,
  // for instance when user joins a file with very long filename.
  minWidth: 0,
});

globalStyle(getModifiedSelector('disabled', `.${composerContainer}`), {
  backgroundColor: cssVar('color-base-strong'),
});

globalStyle(`.${composerErrorMessage}`, {
  margin: 'auto',
  color: Colors.ALERT,
  fontSize: '12px',
});

// When non-expanded the editor and buttons form a row
globalStyle(`:where(.${composerContainer}):not(.${expanded})`, {
  flexDirection: 'row',
});

globalStyle(`.${composerContainer}:focus-within`, {
  border: cssVar('composer-border--focus'),
  boxShadow: cssVar('shadow-focus'),
});

globalStyle(`:where(.${inlineThread}) .${composerContainer}`, {
  padding: `${cssVar('space-2xs')} 0`,
  margin: cssVar('space-2xs'),
});

// if the composer is the only thing in the InlineThread,
// we do not want 2 borders + spacing
globalStyle(`.${inlineThread} :where(.${composerContainer}:only-child)`, {
  border: 'none',
  margin: 0,
  boxShadow: 'none',
});

// TODO(ludo) what is this?
export const closeButtonHidden = internalStyle({
  pointerEvents: 'none',
  visibility: 'hidden',
  selectors: {
    [`${composerContainer}:hover &, ${composerContainer}:focus-within &`]: {
      pointerEvents: 'auto',
      visibility: 'visible',
    },
  },
});

// TODO(ludo) what is this?
export const sendButtonHidden = internalStyle({
  display: 'none',
  pointerEvents: 'none',
  selectors: {
    [`${composerContainer}:focus-within &`]: {
      display: 'block',
      pointerEvents: 'auto',
    },
  },
});
