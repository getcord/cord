import { CORD_V2, defaultGlobalStyle } from '../common/ui/style.js';
import { cordifyClassname } from '../common/cordifyClassname.js';
import { ZINDEX } from '../common/ui/zIndex.js';

export const SCREENSHOT_TRANSITION_IN_MS = 200;

export const overlay = cordifyClassname('overlay');
defaultGlobalStyle(`:where(.${CORD_V2}).${overlay}`, {
  backdropFilter: 'blur(3px)',
  backgroundColor: 'rgba(0, 0, 0, 0.66)',
  bottom: 0,
  left: 0,
  position: 'fixed',
  right: 0,
  top: 0,
  transition: `background ${SCREENSHOT_TRANSITION_IN_MS}ms, opacity ${SCREENSHOT_TRANSITION_IN_MS}ms`,
  zIndex: ZINDEX.popup,
});
