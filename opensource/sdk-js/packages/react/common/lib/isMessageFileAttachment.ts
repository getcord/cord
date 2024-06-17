import type { MessageAttachment, MessageFileAttachment } from '@cord-sdk/types';

export function isMessageFileAttachment(
  attachment: MessageAttachment,
): attachment is MessageFileAttachment {
  return attachment.type === 'file';
}
