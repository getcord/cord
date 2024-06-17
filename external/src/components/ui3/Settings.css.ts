import { CORD_V1, defaultGlobalStyle } from 'common/ui/style.ts';

defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-settings`, {
  display: 'block',
  height: '100%',
  maxHeight: 'inherit',
});
