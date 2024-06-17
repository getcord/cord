import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';

export const checkBox = cordifyClassname('checkbox');
globalStyle(`.${checkBox}`, {
  alignItems: 'center',
  background: Colors.WHITE,
  border: `1px solid ${Colors.GREY_DARK}`,
  borderRadius: 2,
  display: 'flex',
  height: Sizes.CHECKBOX_DEFAULT_SIZE_PX,
  justifyContent: 'center',
  width: Sizes.CHECKBOX_DEFAULT_SIZE_PX,
  cursor: 'pointer',
});

globalStyle(getModifiedSelector('disabled', `.${checkBox}`), {
  cursor: 'default',
});

globalStyle(`.${checkBox}:where([data-checked=true])`, {
  borderColor: Colors.GREY_X_DARK,
});
