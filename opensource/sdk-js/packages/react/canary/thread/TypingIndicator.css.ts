import { globalKeyframes } from '@vanilla-extract/css';
import { typing, typingIndicator } from '../../components/Thread.classnames.js';
import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../../common/ui/style.js';
import { cssVar } from '../../common/ui/cssVariables.js';
export { typingIndicator, typing };

const animateDots = 'cordAnimateDots';
globalKeyframes(animateDots, {
  '50%': {
    content: '".."',
  },
  '100%': {
    content: '"..."',
  },
});

globalStyle(`.${typing}`, {
  display: 'flex',
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  gap: `${cssVar('space-2xs')}`,
});

globalStyle(`.${typing} .${typingIndicator}`, {
  color: cssVar('color-content-secondary'),
});

defaultGlobalStyle(
  `:where(.${CORD_V2} .${typing}) .${typingIndicator}::after`,
  {
    animation: `${animateDots} 1s linear infinite`,
    content: '"."',
  },
);
