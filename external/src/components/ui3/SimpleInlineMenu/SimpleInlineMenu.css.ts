import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

import { Sizes } from 'common/const/Sizes.ts';

import { Colors } from 'common/const/Colors.ts';
import { Styles } from 'common/const/Styles.ts';

export const menu = cordifyClassname('inline-menu');
export const item = cordifyClassname('item');
export const itemIconWrapper = cordifyClassname('item-icon');
export const itemTitle = cordifyClassname('item-title');
export const itemSelected = cordifyClassname('selected');

globalStyle(`.${menu}`, {
  background: Colors.WHITE,
  border: '1px ' + Colors.GREY_LIGHT + ' solid',
  borderRadius: Sizes.SMALL + 'px',
  boxShadow: Styles.DEFAULT_SHADOW,
  padding: Sizes.MEDIUM + 'px',
  color: Colors.GREY_DARK,
});

globalStyle(`.${menu} :where(.${item})`, {
  alignItems: 'center',
  borderRadius: Sizes.SMALL + 'px',
  cursor: 'pointer',
  display: 'flex',
  fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
  justifyContent: 'space-between',
  lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
  padding: Sizes.MEDIUM + 'px',
});

globalStyle(`.${menu} :where(.${item}.${itemSelected})`, {
  backgroundColor: Colors.GREY_X_LIGHT,
});

globalStyle(`:where(.${menu}) .${itemIconWrapper}`, {
  alignItems: 'center',
  display: 'flex',
  flex: 'none',
  height: '14px',
  marginRight: Sizes.MEDIUM,
  width: '14px',
});

globalStyle(`:where(.${menu}) .${itemTitle}`, {
  flex: 1,
});
