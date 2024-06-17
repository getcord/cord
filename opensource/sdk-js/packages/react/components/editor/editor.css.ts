import { globalStyle } from '../../common/ui/style.js';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import { Sizes } from '../../common/const/Sizes.js';
import { CODE_STYLE } from '../../common/lib/styles.js';

export const inlineCode = cordifyClassname('inline-code');
globalStyle(`.${inlineCode}`, {
  ...CODE_STYLE,
  padding: `0 ${Sizes.XSMALL}px`,
});
