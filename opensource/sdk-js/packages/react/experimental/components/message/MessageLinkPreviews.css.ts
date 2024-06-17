import { globalStyle } from '../../../common/ui/style.js';
import * as classes from '../../../components/MessageContent.classnames.js';
export default classes;

const { messageLinkPreviews } = classes;

globalStyle(`.${messageLinkPreviews}`, {
  gridArea: 'linkPreviews',
});
