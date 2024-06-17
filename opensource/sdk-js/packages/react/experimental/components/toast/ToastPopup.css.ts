import { cssVar } from '../../../common/ui/cssVariables.js';
import { getModifiedSelector } from '../../../common/ui/modifiers.js';
import { globalStyle } from '../../../common/ui/style.js';
import { ZINDEX } from '../../../common/ui/zIndex.js';
import { cordifyClassname } from '../../../common/cordifyClassname.js';
import { SUCCESS_POP_UP_TRANSITION_MS } from './const.js';

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

globalStyle(`.${popup}.${smallToast}`, {
  marginLeft: cssVar('space-3xl'),
  marginRight: cssVar('space-3xl'),
});
