import type { UUID } from 'common/types/index.ts';
import type {
  MessageContent,
  MessageNode,
  MessageNodeWithChildren,
  MessageTextNode,
} from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { splitStringToWsAndText } from 'server/src/util/splitStringToWsAndText.ts';

// Slack docs say they will accept text messages up to 40,000 characters, but
// in practice we see errors if text length exceeds 3,000 characters.  Pick a
// max length after which we will truncate
const MAX_SLACK_TEXT_LENGTH = 2970;

type ImplHelpers = {
  lookUpSlackUserID(userID: UUID): Promise<string | null>;
};

// Convert `MessageContent` to a string of Slack Mrkdwn. This is an async
// function, because some content may require database lookups.
export async function slackMrkdwnFromMessageContentImpl(
  content: MessageContent,
  helpers: ImplHelpers,
): Promise<string> {
  // Convert the message content into a list of text segments. Each of these
  // can already contain some Mrkdwn syntax, but the bold/italic/code
  // formatting has not been converted to Mrkdwn.
  const segments: MrkdwnSegment[] = await nodesToMrkdwnSegments(
    content,
    helpers,
  );

  // Keep track off whether bold/italic/code are currently on.
  const formattingState: MrkdwnFormatting = {
    bold: false,
    italic: false,
    code: false,
  };

  // The eventual output
  let output = '';

  // Keep track in what order we've started bold/italic/code blocks.
  const formattingStack: Array<keyof MrkdwnFormatting> = [];

  // This stores whitespace that we have taken from the end of a segment and
  // not yet added to `output`.
  let remainingWhitespace = '';

  // Okay, let's start! Iterate through those text segments.
  for (const segment of segments) {
    // `text` may already contain some Mrkdwn, but we still have to apply
    // bold/italic/code formatting.
    let { text } = segment;

    // Special characters for text formatting in Mrkdwn (in
    // bold/italics/strikethrough/as code) are '*', '_', '~' and '`',
    // respectively. If these characters appear in the text, we have to jump
    // through a hoop to get it displayed: by using Slack's `<!date>` tag for
    // embedding a date, then giving it an invalid date, we can provide a
    // fallback text that will
    // be displayed verbatim.
    text = text.replace(/([*~_`]+)/, (...m) => `<!date^00000000^{_}|${m[1]}>`);

    // We break the bit of text into three parts: we split off all whitespace
    // the beginning (`wsStart`) and end (`wsEnd`). The bit in the middle is
    // the remaining text, and that does not begin or end with whitespace.
    let [wsStart, middle, wsEnd] = splitStringToWsAndText(text); // eslint-disable-line prefer-const

    if (!middle) {
      // If `middle` is empty it means that the text segment is either empty or
      // contains only whitespace characters. In that case we append all that
      // to `remainingWhitespace` and move on to the next segment.
      remainingWhitespace += wsStart + wsEnd;
      continue;
    }

    // `whiteSpace` is all the whitespace before the main text (`middle`), i.e.
    // it's the carry-over whitespace from earlier, plus `wsStart`.
    let whiteSpace = remainingWhitespace + wsStart;
    // We are going to deal with `whiteSpace` and `middle` next, and leave the
    // remaining whitespace at the end to the next iteration.
    remainingWhitespace = wsEnd;

    const whiteSpaceContainsLineBreak = whiteSpace.indexOf('\n') >= 0;

    // Are there formatting modes we have to switch off? Yes, if there are any
    // that we previously switched on, but are set to `false` in this
    // segment.  Also yes, if the leading whitespace contain a line break, in
    // which case we need to switch off all formatting before that. (We'll
    // switch the right ones back one below where we do `formattingOn`.)
    let formattingOff = '';
    while (
      formattingStack.length &&
      (whiteSpaceContainsLineBreak ||
        formattingTypes.some((key) => formattingState[key] && !segment[key]))
    ) {
      // When we are in here, we know there is a formatting mode that neeeds
      // switching off. But we have to switch them off in the right order,
      // i.e. the reverse of the order in which they were switched on. So,
      // let's switch off the formatting that was switched on last. It might
      // be that we switch something off here, that is set to on for this
      // segment though. In that case, we'll switch it back on in the next
      // step.
      // For example:
      //   [ { text: 'foo', italic: true, bold: true },
      //     { text: 'bar', bold: true } ]
      // will become: `_*foo*_ *bar*`, because when we process 'foo' we'll
      // switch on italic and then bold (that's just the order in which we
      // switch on things), but then the next segment only wants bold on. So,
      // because of how Markdown works, we switch off bold, so we can switch
      // off italics, so for 'bar' we switch bold back on again.
      const key = formattingStack.pop()!;
      formattingOff += formattingCharacters[key];
      formattingState[key] = false;
    }

    // Are there formatting modes we have to switch on?
    let formattingOn = '';
    for (const key of formattingTypes) {
      if (segment[key] && !formattingState[key]) {
        formattingOn += formattingCharacters[key];
        formattingStack.push(key);
        formattingState[key] = true;
      }
    }

    // If there is no whitespace at the beginning of the segment at all, but we
    // want to switch off or on some formatting, then we have to inject a
    // space. It will get injected after the `formattingOff` characters, but
    // before the `formattingOn` ones. We are using unicode's zero width
    // space, so it won't show.
    if (output && !whiteSpace && (formattingOff || formattingOn)) {
      whiteSpace = '\u200b';
    }

    // If `middle` contains a line break (it wouldn't be at the beginning or end,
    // but could be somewhere inside), we also need to terminate all formatting before
    // it and switch it on again afterwards.
    if (formattingStack.length && middle.indexOf('\n') >= 0) {
      const on = formattingStack.map((key) => formattingCharacters[key]);
      const off = [...on].reverse();
      middle = middle.replace(
        /\s*\n\s*/g,
        ([m]) => `${off.join()}${m}${on.join('')}`,
      );
    }

    // Okay, now add to the output: formattingOff characters, then whatever
    // whitespace we have at the beginning, then formattingOn characters,
    // and then the payload text.
    output += formattingOff + whiteSpace + formattingOn + middle;
  }

  // All segments have been processed. If some formatting modes are on, we have
  // to switch them off now.
  output += formattingStack
    .reverse()
    .map((key) => formattingCharacters[key])
    .join('');

  // Append any remaining whitespace.
  output += remainingWhitespace;

  // Any sequence of whitespace that ends in a new-line will be replaced with a
  // single newline. And then we can just trim whitespace at the beginning
  // and end, and there we have our result.
  output = output.replace(/\s+\n/g, '\n').trim();
  if (output.length > MAX_SLACK_TEXT_LENGTH) {
    output = output.slice(0, MAX_SLACK_TEXT_LENGTH) + '...(message too long)';
  }
  return output;
}

// A segment of Mrkdwn. The text may contain mrkdwn constructs, but bold/italic
// formatting has not been applied.
type MrkdwnSegment = { text: string } & MrkdwnFormatting;
type MrkdwnFormatting = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};
const formattingCharacters: Record<keyof MrkdwnFormatting, string> = {
  bold: '*',
  italic: '_',
  code: '`',
};
const formattingTypes: Array<keyof MrkdwnFormatting> = [
  'italic',
  'bold',
  'code',
];

async function nodesToMrkdwnSegments(
  nodes: MessageNode[],
  helpers: ImplHelpers,
): Promise<MrkdwnSegment[]> {
  // As we produce segments of Mrkdwn, some of them will be produced right
  // here, some will be produced async. So we keep a list of ready segments
  // and promises, which will get converted to a list of segments at the end.
  const segments: Array<MrkdwnSegment[] | Promise<MrkdwnSegment[]>> = [];

  // If we encounter NUMBER_BULLET nodes on this level, we need to know how
  // many we have seen already.
  let numberBulletCount = 0;

  for (const node of nodes) {
    if (node.type === undefined) {
      // `node` is a `MessageTextNode`. Copy over the formatting states
      // (bold/italic), escape some special characters in the text.
      segments.push([{ ...node, text: mrkdwnEscapeText(node.text) }]);
      continue;
    }

    switch (node.type) {
      case MessageNodeType.PARAGRAPH:
        segments.push(nodesToMrkdwnSegments(node.children, helpers));
        segments.push([{ text: '\n' }]);
        break;
      case MessageNodeType.LINK: {
        const nodeText = (node.children[0] as MessageTextNode).text;
        segments.push([
          {
            text: `<${node.url}|${nodeText}>`,
          },
        ]);
        break;
      }
      case MessageNodeType.BULLET:
        segments.push(newLinePrefixAndIndent('• ', '  ', node, helpers));
        break;
      case MessageNodeType.NUMBER_BULLET:
        segments.push(
          newLinePrefixAndIndent(
            `${++numberBulletCount}. `,
            '  ',
            node,
            helpers,
          ),
        );
        break;
      case MessageNodeType.QUOTE:
        segments.push(newLinePrefixAndIndent('> ', '  ', node, helpers));
        break;
      case MessageNodeType.TODO:
        segments.push(newLinePrefixAndIndent('[] ', '  ', node, helpers));
        break;
      case MessageNodeType.MENTION:
      case MessageNodeType.ASSIGNEE: {
        const userID = node.user.id;
        segments.push(
          helpers.lookUpSlackUserID(userID).then((slackUserID) => {
            if (slackUserID) {
              return [{ text: `<@${slackUserID}>` }];
            } else {
              return nodesToMrkdwnSegments(node.children, helpers);
            }
          }),
        );
        break;
      }
      case MessageNodeType.CODE:
        segments.push(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          nodesToMrkdwnSegments(node.children, helpers).then((segments) =>
            segments.map((segment) => ({
              ...segment,
              code: true,
            })),
          ),
        );
        break;
    }
  }

  // Convert our `Array<MrkdwnSegment[] | Promise<MrkdwnSegment[]>>` into one
  // `Promise<MrkdwnSegment[]>` (via `Promise<MrkdwnSegment[][]>`).
  return await Promise.all(segments).then((arrayOfArrays) =>
    arrayOfArrays.flat(),
  );
}

// Helper function for those constructs that begin with some prefix and then
// indent every line of text, like a bullet list item or a quote.
async function newLinePrefixAndIndent(
  prefix: string,
  indent: string,
  node: MessageNodeWithChildren,
  helpers: ImplHelpers,
): Promise<MrkdwnSegment[]> {
  return [
    { text: `\n${prefix}` },
    ...(await nodesToMrkdwnSegments(node.children, helpers)).map((segment) => ({
      ...segment,
      text: segment.text.replace(/\n/g, `\n${indent}`),
    })),
  ];
}

export function mrkdwnEscapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '\u200b&gt;');
}
