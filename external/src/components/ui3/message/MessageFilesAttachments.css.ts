import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

import {
  messageAttachment,
  messageImageAttachments,
  messageVideoAttachments,
  messageDocumentAttachments,
  messageLinkPreviews,
} from '@cord-sdk/react/components/MessageContent.classnames.ts';
export {
  messageAttachment,
  messageImageAttachments,
  messageVideoAttachments,
  messageDocumentAttachments,
  messageLinkPreviews,
};

// TODOFIX ME: Once we deprecate the old MessageAttachments component,
// move these styles into MessageContentImpl.css, as it is the only
// place they are being used.
globalStyle(`.${messageAttachment}`, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: cssVar('space-2xs'),
  alignItems: 'start',
});
globalStyle(`.${messageImageAttachments}`, { gridArea: 'imageAttachments' });
globalStyle(`.${messageVideoAttachments}`, { gridArea: 'videoAttachments' });
globalStyle(`.${messageDocumentAttachments}`, {
  gridArea: 'documentAttachments',
});
globalStyle(`.${messageLinkPreviews}`, {
  gridArea: 'linkPreviews',
  width: '100%',
  overflowX: 'auto',
});
