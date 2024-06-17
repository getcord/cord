import { isMessageNodeText } from '@cord-sdk/react/common/lib/messageNode.ts';
import { MessageNodeType } from '@cord-sdk/types';
import type { MessageContent } from '@cord-sdk/types';

export function appendMessageContent(
  content: MessageContent | null,
  appendedContent: string,
): MessageContent | null {
  if (
    !content ||
    content.length !== 1 ||
    content[0].type !== MessageNodeType.MARKDOWN
  ) {
    return null;
  }

  const markdownNode = content[0];

  if (
    markdownNode.children.length !== 1 ||
    !isMessageNodeText(markdownNode.children[0])
  ) {
    // This should be enforced by validateMessageContent.
    return null;
  }

  return [
    {
      type: markdownNode.type,
      children: [{ text: markdownNode.children[0].text + appendedContent }],
    },
  ];
}
