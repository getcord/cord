import { cssVar } from 'common/ui/cssVariables.ts';
import { globalStyle } from 'common/ui/style.ts';
import * as classes from 'external/src/components/ui3/message/MessageFileAttachment.classnames.ts';
export const { documentAttachment } = classes;

globalStyle(`.${documentAttachment}`, {
  maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
  marginTop: cssVar('space-2xs'),
});
