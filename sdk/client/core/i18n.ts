import { useMemo } from 'react';
import type { MessageTextNode, TranslationResources } from '@cord-sdk/types';
import { MessageNodeType } from 'common/types/index.ts';
import type { MessageContent, MessageNode } from 'common/types/index.ts';
import { createParagraphNode } from '@cord-sdk/react/common/lib/messageNode.ts';
import { useCordTranslation } from '@cord-sdk/react';
import { createI18n } from '@cord-sdk/react/common/i18n.ts';

const i18n = createI18n();

export { i18n };

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
