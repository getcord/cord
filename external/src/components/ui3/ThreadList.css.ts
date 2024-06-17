import { clickableThread } from '@cord-sdk/react/components/Thread.classnames.ts';
export { clickableThread };
import { cssVar } from 'common/ui/cssVariables.ts';
import { CORD_V1, defaultGlobalStyle } from 'common/ui/style.ts';

defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-thread-list`, {
  display: 'block',
  height: 'auto',
  overflow: 'auto',
  position: 'relative',
  background: cssVar('color-base'),
});

defaultGlobalStyle(
  `:where(.${CORD_V1}).cord-component-thread-list .${clickableThread}`,
  {
    width: '100%',
    cursor: 'pointer',
  },
);
