import { cssVar } from '../../../common/ui/cssVariables.js';
import { globalStyle } from '../../../common/ui/style.js';
import { cordifyClassname } from '../../../common/cordifyClassname.js';

export const toast = cordifyClassname('toast');
globalStyle(`.${toast}`, {
  alignItems: 'center',
  backgroundColor: cssVar('color-content-emphasis'),
  borderRadius: cssVar('space-2xl'),
  boxShadow: cssVar('shadow-large'),
  cursor: 'default',
  display: 'flex',
  margin: cssVar('space-2xs'),
  paddingBlock: cssVar('space-3xs'),
  paddingInlineStart: cssVar('space-m'),
  paddingInlineEnd: cssVar('space-xs'),
});

export const label = cordifyClassname('label');
globalStyle(`.${toast} .${label}`, {
  flex: 1,
  textAlign: 'center',
  color: cssVar('color-base'),
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});
