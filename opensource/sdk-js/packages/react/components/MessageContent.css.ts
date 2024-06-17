import { cssVar } from '../common/ui/cssVariables.js';
import { globalStyle } from '../common/ui/style.js';
import * as classes from './MessageContent.classnames.js';
export default classes;

const { messageContent, messageAttachment } = classes;

globalStyle(`.${messageContent}`, {
  gridArea: 'messageContent',
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateAreas: `
    "messageText"
    "imageAttachments"
    "videoAttachments"
    "documentAttachments"
    "linkPreviews"`,
  overflow: 'auto',
  maxHeight: '100%',
});

globalStyle(`.${messageAttachment}`, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: cssVar('space-2xs'),
  alignItems: 'start',
});
