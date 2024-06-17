import type { MessageContent } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';

export function isAsyncIterable(
  x: any,
): x is AsyncIterable<string | undefined> {
  return typeof x?.[Symbol.asyncIterator] === 'function';
}

export function stringToMessageContent(s: string): MessageContent {
  return s.split('\n').map((ss) => ({
    type: MessageNodeType.PARAGRAPH,
    children: [{ text: ss }],
  }));
}
