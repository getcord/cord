import { globalStyle } from '../../common/ui/style.js';
import { ZINDEX } from '../../common/ui/zIndex.js';
import * as classes from './WithPopper.classnames.js';

export default classes;

const { blockingOverlay } = classes;

globalStyle(`.${blockingOverlay}`, {
  bottom: 0,
  cursor: 'auto',
  left: 0,
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: ZINDEX.popup,
});
