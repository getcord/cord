import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';

export const SCREENSHOT_TRANSITION_IN_MS = 200;

export const overlay = cordifyClassname('overlay');
globalStyle(`.${overlay}`, {
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
