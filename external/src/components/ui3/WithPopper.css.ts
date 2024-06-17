import * as classes from 'external/src/components/ui3/WithPopper.classnames.ts';
import { globalStyle } from 'common/ui/style.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
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
