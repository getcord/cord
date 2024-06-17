import { globalStyle } from '@vanilla-extract/css';
import { cordifyClassname } from '../../common/cordifyClassname.js';

import { ZINDEX } from '../../common/ui/zIndex.js';

export const dndContainer = cordifyClassname('dnd-container');
globalStyle(`.${dndContainer}`, {
  position: 'relative',
});

export const dropFilesOverlay = cordifyClassname('dnd-overlay');
globalStyle(`.${dropFilesOverlay}`, {
  alignItems: 'center',
  background: '#66ff66bb',
  border: '3px dashed green',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  pointerEvents: 'none',
  position: 'absolute',
  inset: 0,
  zIndex: ZINDEX.popup,
});
