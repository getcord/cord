import { globalStyle } from 'common/ui/style.ts';
import * as classes from '@cord-sdk/react/components/MessageContent.classnames.ts';
export default classes;

const { messageContent } = classes;

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
});
