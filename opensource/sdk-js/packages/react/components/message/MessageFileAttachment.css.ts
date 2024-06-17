import { globalStyle } from '../../common/ui/style.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import * as classes from './MessageFileAttachment.classnames.js';
export const { documentAttachment } = classes;

globalStyle(`.${documentAttachment}`, {
  maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
  marginTop: cssVar('space-2xs'),
});
