import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export const iconSmall = cordifyClassname('icon-small');
globalStyle(`.${iconSmall}`, {
  height: cssVar('space-m'),
  width: cssVar('space-m'),
});

export const iconLarge = cordifyClassname('icon-large');
globalStyle(`.${iconLarge}`, {
  height: cssVar('space-l'),
  width: cssVar('space-l'),
});
