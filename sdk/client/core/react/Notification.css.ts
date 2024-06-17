import { CORD_V1, defaultGlobalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-notification`, {
  isolation: 'isolate',
  backgroundColor: cssVar('color-base'),
});
