import { Sizes } from 'common/const/Sizes.ts';
import { CODE_STYLE } from 'common/ui/editorStyles.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const inlineCode = cordifyClassname('inline-code');
globalStyle(`.${inlineCode}`, {
  ...CODE_STYLE,
  padding: `0 ${Sizes.XSMALL}px`,
});
