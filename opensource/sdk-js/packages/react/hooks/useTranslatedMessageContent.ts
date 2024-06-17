import { useMemo } from 'react';
import { MessageNodeType } from '@cord-sdk/types';
import type {
  MessageContent,
  MessageNode,
  MessageTextNode,
  TranslationResources,
} from '@cord-sdk/types';
import { createParagraphNode } from '../common/lib/messageNode.js';
import { useCordTranslation } from './useCordTranslation.js';

export function useTranslatedMessageContent(
  translationKey: string | null | undefined,
  content: MessageContent,
) {
  const { t } = useCordTranslation('message_templates');
  return useMemo(() => {
    if (!translationKey) {
      return content;
    }
    const mentions = findMentions(content);
    const translatedContent = t(
      translationKey as keyof TranslationResources['message_templates'],
      {
        returnObjects: true,
        // Something that's not a string or an array, so we can tell if we got
        // the default value back and fall back to the untranslated content.
        // `null` and `undefined` get treated as "I'm not supplying a default
        // value", so use an empty object.
        defaultValue: {},
        replace: Object.fromEntries(
          mentions.map((m, i) => [`mention${i + 1}`, m]),
        ),
      },
    );
    if (Array.isArray(translatedContent)) {
      return translatedContent as MessageContent;
    }
    if (typeof translatedContent === 'string') {
      return [createParagraphNode(translatedContent)];
    }
    return content;
  }, [translationKey, content, t]);
}

type MentionData = {
  userID: string;
  text: string;
};

function findMentions(content: MessageContent) {
  const result: MentionData[] = [];
  for (const node of content) {
    findNodeMentions(node, result);
  }
  return result;
}

function findNodeMentions(node: MessageNode, result: MentionData[]) {
  switch (node.type) {
    case MessageNodeType.MENTION:
      result.push({
        userID: node.user.id,
        text: (node.children[0] as MessageTextNode).text,
      });
      break;
    default:
      if ('children' in node) {
        for (const child of node.children) {
          findNodeMentions(child, result);
        }
      }
  }
}
