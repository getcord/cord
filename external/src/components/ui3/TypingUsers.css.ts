import {
  globalStyle,
  globalKeyframes,
  defaultGlobalStyle,
  CORD_V1,
} from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import {
  typingIndicator,
  typing,
} from '@cord-sdk/react/components/Thread.classnames.ts';
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
globalStyle(`.${typing} :where(.${typingIndicator})`, {
  color: cssVar('color-content-secondary'),
});
defaultGlobalStyle(
  `:where(.${CORD_V1}) :where(.${typing} .${typingIndicator})::after`,
  {
    animation: `${animateDots} 1s linear infinite`,
    content: '"."',
  },
);
