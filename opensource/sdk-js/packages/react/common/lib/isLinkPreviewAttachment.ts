import type {
  MessageAttachment,
  MessageLinkPreviewAttachment,
} from '@cord-sdk/types';

export function isLinkPreviewAttachment(
  attachment: MessageAttachment,
): attachment is MessageLinkPreviewAttachment {
  return attachment.type === 'link_preview';
}
