import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';

export const menu = cordifyClassname('menu');
globalStyle(`.${menu}`, {
  backgroundColor: cssVar('color-base'),
  borderRadius: cssVar('border-radius-medium'),
  borderColor: cssVar('color-base-x-strong'),
  boxShadow: cssVar('shadow-small'),
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  listStyle: 'none',
  margin: `0 ${cssVar('space-2xs')}`,
  minHeight: 0,
  minWidth: `calc(${cssVar('space-m')} * 10)`,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: cssVar('space-2xs'),
  zIndex: ZINDEX.popup,
});
