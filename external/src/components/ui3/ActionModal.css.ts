import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export const actionModalBackdrop = cordifyClassname('action-modal-backdrop');
globalStyle(`.${actionModalBackdrop}`, {
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.33)',
  display: 'flex',
  inset: 0,
  justifyContent: 'center',
  position: 'fixed',
  zIndex: ZINDEX.modal,
});

export const actionModal = cordifyClassname('action-modal-container');
globalStyle(`.${actionModal}`, {
  boxShadow: cssVar('shadow-large'),
  borderRadius: cssVar('border-radius-medium'),
  backgroundColor: cssVar('color-base'),
  maxWidth: '400px',
});

export const actionModalTitle = cordifyClassname('action-modal-title');
globalStyle(`.${actionModalTitle}`, {
  padding: cssVar('space-xl'),
});

export const actionModalContent = cordifyClassname('action-modal-content');
globalStyle(`.${actionModalContent}`, {
  color: cssVar('color-content-emphasis'),
  padding: cssVar('space-xl'),
  paddingTop: 0,
});

export const actionModalActions = cordifyClassname('action-modal-actions');
globalStyle(`.${actionModalActions}`, {
  borderRadius: '0px 0px 4px 4px',
  display: 'flex',
  justifyContent: 'flex-end',
  padding: cssVar('space-2xs'),
});

globalStyle(`.${actionModalActions} :where(:not(:first-child))`, {
  marginLeft: cssVar('space-3xs'),
});
