import {
  defaultGlobalStyle as globalStyle,
  keyframes,
} from '../../common/ui/style.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import { getModifiedSelector } from '../../common/ui/modifiers.js';
import { resolvedThreadHeader } from '../ThreadedComments.classnames.js';
import { button } from './Button.classnames.js';
import * as classes from './Icon.classnames.js';
import { emptyStateContainer } from './EmptyStateWithIcon.classnames.js';

export default classes;

const { icon, large, medium, spinnerIcon } = classes;

globalStyle(`.${icon}`, {
  // Display block removes line after svg
  display: 'block',
});

globalStyle(`:where(.${icon}).${large}`, {
  width: cssVar('space-l'),
  height: cssVar('space-l'),
});

globalStyle(`:where(.${icon}).${medium}`, {
  width: cssVar('space-m'),
  height: cssVar('space-m'),
});

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

//SpinnerIcon
globalStyle(`:where(.${icon}).${spinnerIcon}`, {
  animation: `${spin} 1s linear infinite`,
});
// The SpinnerIcon in a loading Button
globalStyle(
  getModifiedSelector('loading', `.${button} :where(.${icon}.${spinnerIcon})`),
  {
    left: 0,
    margin: 'auto',
    position: 'absolute',
    right: 0,
  },
);

// Button - Icon
globalStyle(
  getModifiedSelector(
    'loading',
    `:where(.${button}) .${icon}:not(.${spinnerIcon})`,
  ),
  {
    visibility: 'hidden',
  },
);

//  Button - img Icon
globalStyle(getModifiedSelector('disabled', `:where(.${button}) img.${icon}`), {
  opacity: 0.5,
});

globalStyle(`.${emptyStateContainer} :where(.${icon})`, {
  height: cssVar('space-2xl'),
  width: cssVar('space-2xl'),
  marginBottom: cssVar('space-2xs'),
});

globalStyle(`:where(.${resolvedThreadHeader}) .${icon}`, {
  color: cssVar('color-brand-primary'),
  height: cssVar('space-l'),
  width: cssVar('space-l'),
});
