import { globalStyle } from '../../../common/ui/style.js';
import * as classes from '../../../components/MessageContent.classnames.js';
export default classes;

const {
  messageImageAttachments,
  messageVideoAttachments,
  messageDocumentAttachments,
} = classes;

globalStyle(`.${messageImageAttachments}`, { gridArea: 'imageAttachments' });
globalStyle(`.${messageVideoAttachments}`, { gridArea: 'videoAttachments' });
globalStyle(`.${messageDocumentAttachments}`, {
  gridArea: 'documentAttachments',
});
