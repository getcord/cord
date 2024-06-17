import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';

export const dndContainer = cordifyClassname('dnd-container');
globalStyle(`.${dndContainer}`, {
  position: 'relative',
});

export const dropFilesOverlay = cordifyClassname('dnd-overlay');
globalStyle(`.${dropFilesOverlay}`, {
  alignItems: 'center',
  background: '#66ff66bb',
  border: '3px dashed green',
  bottom: '0',
  display: 'flex',
  justifyContent: 'center',
  left: '0',
  pointerEvents: 'none',
  position: 'absolute',
  right: '0',
  top: '0',
  zIndex: ZINDEX.popup,
});
