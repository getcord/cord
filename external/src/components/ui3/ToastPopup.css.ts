import { globalStyle, cordifyClassname } from 'common/ui/style.ts';

import { ZINDEX } from 'common/ui/zIndex.ts';

import { SUCCESS_POP_UP_TRANSITION_MS } from 'common/const/Timing.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';

export const popup = cordifyClassname('toast-popup');

globalStyle(`.${popup}`, {
  left: 0,
  position: 'absolute',
  right: 0,
  top: `calc(-1 * ${cssVar('space-m')})`, // Positions popup just above its container
  transform: `translateY(-100%)`,
  transition: `transform ${SUCCESS_POP_UP_TRANSITION_MS}ms`,
  zIndex: ZINDEX.modal,
});

globalStyle(getModifiedSelector('hidden', `.${popup}`), {
  display: 'none',
});

export const smallToast = cordifyClassname('small-toast');

globalStyle(`:where(.${popup}).${smallToast}`, {
  marginLeft: cssVar('space-3xl'),
  marginRight: cssVar('space-3xl'),
});
