import * as classes from 'external/src/components/ui3/Separator.classnames.ts';
import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { menu } from 'external/src/components/ui3/Menu.css.ts';

const { separator } = classes;
export { separator };

globalStyle(`.${separator}`, {
  backgroundColor: cssVar('color-base-x-strong'),
  flex: 'none',
  height: `calc(${cssVar('space-4xs')}/2)`,
  marginBlock: cssVar('space-2xs'),
});

/** Styles when used in other components  */
globalStyle(`.${menu} > :where(.${separator})`, {
  marginBlock: cssVar('space-3xs'),
});
