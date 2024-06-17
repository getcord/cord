import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const editedMessageTag = cordifyClassname('edited-message-tag');
globalStyle(`.${editedMessageTag}`, {
  marginTop: cssVar('space-2xs'),
  color: cssVar('color-content-secondary'),
});
