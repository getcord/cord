import { globalStyle } from '../../common/ui/style.js';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import { cssVar } from '../../common/ui/cssVariables.js';

export const editedMessageTag = cordifyClassname('edited-message-tag');
globalStyle(`.${editedMessageTag}`, {
  marginTop: cssVar('space-2xs'),
  color: cssVar('color-content-secondary'),
});
