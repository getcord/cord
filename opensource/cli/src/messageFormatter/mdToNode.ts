import type Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import * as markdownUtils from 'markdown-it/lib/common/utils';
import type { MessageContent } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { mentionPlugin } from 'src/messageFormatter/mentionPlugin';

const md = MarkdownIt('zero').enable([
  'code',
  'fence',
  'list',
  'emphasis',
  'backticks',
  'blockquote',
  'link',
  'newline',
  'text',
]);

md.options.breaks = true;
md.use(mentionPlugin);

// Use markdown-it to parse the markdown into "tokens"
export function markdownToNode(message: string): MessageContent {
  const tokens = md.parse(message, {});
  return consumeBlocksUntil(tokens, null);
}

function consumeBlocksUntil(
  tokens: Token[],
  endType: string | null,
  parent: Token | null = null,
): MessageContent {
  const result: MessageContent = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const token = tokens.shift();

    if (!token) {
      if (endType === null) {
        break;
      } else {
        throw new Error(`Unexpected end of block token list before ${endType}`);
      }
    }

    if (token.type === endType) {
      break;
    }

    switch (token.type) {
      case 'inline':
        result.push(...consumeInlinesUntil(token.children, null));
        break;
      case 'paragraph_open': {
        const children = consumeBlocksUntil(tokens, 'paragraph_close');
        if (parent?.type === 'blockquote_open') {
          result.push(...children);
        } else {
          result.push({
            type: MessageNodeType.PARAGRAPH,
            children,
          });
        }
        break;
      }
      case 'blockquote_open':
        result.push({
          type: MessageNodeType.QUOTE,
          children: consumeBlocksUntil(tokens, 'blockquote_close', token),
        });
        break;
      case 'bullet_list_open':
        result.push(...consumeBlocksUntil(tokens, 'bullet_list_close', token));
        break;
      case 'ordered_list_open':
        result.push(...consumeBlocksUntil(tokens, 'ordered_list_close', token));
        break;
      case 'list_item_open': {
        const children = consumeBlocksUntil(tokens, 'list_item_close');
        if (parent?.type === 'bullet_list_open') {
          result.push({ type: MessageNodeType.BULLET, children });
        } else if (parent?.type === 'ordered_list_open') {
          const bulletNumber = Number(token.info);
          if (!bulletNumber) {
            throw new Error('No bullet number provided');
          }
          result.push({
            type: MessageNodeType.NUMBER_BULLET,
            bulletNumber,
            children,
          });
        } else {
          throw new Error(`Unknown list parent type ${parent?.type}`);
        }
        break;
      }
      case 'fence':
      case 'code_block':
        result.push({
          type: MessageNodeType.CODE,
          children: [{ text: token.content }],
        });
        break;
      default:
        throw new Error(`Unknown block token type: ${token.type}`);
    }
  }

  return result;
}

type InlineMarks = { italic: boolean; bold: boolean };

function consumeInlinesUntil(
  tokens: Token[] | null,
  endType: string | null,
  marks: InlineMarks = { italic: false, bold: false },
): MessageContent {
  if (tokens === null) {
    throw new Error('Empty inline token');
  }

  const result: MessageContent = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const token = tokens.shift();

    if (!token) {
      if (endType === null) {
        break;
      } else {
        throw new Error(
          `Unexpected end of inline token list before ${endType}`,
        );
      }
    }

    if (token.type === endType) {
      break;
    }

    switch (token.type) {
      case 'text':
        if (token.content) {
          result.push({
            text: markdownUtils.unescapeMd(token.content),
            ...(marks.bold && { bold: true }),
            ...(marks.italic && { italic: true }),
          });
        }
        break;
      case 'code_inline':
        if (token.content) {
          result.push({
            text: markdownUtils.unescapeMd(token.content),
            code: true,
            ...(marks.bold && { bold: true }),
            ...(marks.italic && { italic: true }),
          });
        }
        break;
      case 'em_open':
        result.push(
          ...consumeInlinesUntil(tokens, 'em_close', {
            ...marks,
            italic: true,
          }),
        );
        break;
      case 'strong_open':
        result.push(
          ...consumeInlinesUntil(tokens, 'strong_close', {
            ...marks,
            bold: true,
          }),
        );
        break;
      case 'link_open': {
        const url = token.attrGet('href');
        if (!url) {
          throw new Error('Url not provided to link');
        }
        result.push({
          type: MessageNodeType.LINK,
          url,
          children: consumeInlinesUntil(tokens, 'link_close', marks),
        });
        break;
      }
      case 'mention':
        result.push({
          type: MessageNodeType.MENTION,
          user: { id: token.content.substring(1) },
          // TODO: mentions ignore bold/italic marks, is that correct?
          // TODO: some way to encode what the plaintext should be, separate
          // from the user ID?
          children: [{ text: token.content }],
        });
        break;
      // eslint-disable-next-line @cspell/spellchecker
      case 'softbreak':
        // TODO: unclear if this is correct.
        break;
      // eslint-disable-next-line @cspell/spellchecker
      case 'hardbreak':
        // TODO: unclear if this is correct.
        break;
      default:
        throw new Error(`Unknown inline token type: ${token.type}`);
    }
  }

  return result;
}
