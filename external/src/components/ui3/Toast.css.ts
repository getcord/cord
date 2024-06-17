import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';

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
globalStyle(`:where(.${toast}) .${label}`, {
  flex: 1,
  textAlign: 'center',
  color: cssVar('color-base'),
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});
