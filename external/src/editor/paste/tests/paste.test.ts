/**
 * @jest-environment jsdom
 */
import { Transforms } from 'slate';
import { MessageNodeType } from 'common/types/index.ts';
import {
  createMentionNode,
  createMessageNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import {
  googleDocs,
  googleDocsNestedBullets,
} from 'external/src/editor/paste/tests/pasteContent/googleDocs.ts';
import {
  simpleHTML,
  simpleText,
} from 'external/src/editor/paste/tests/pasteContent/simple.ts';
import { microsoftWord } from 'external/src/editor/paste/tests/pasteContent/word.ts';
import {
  cleanPastedNodes,
  deserializeElementToMessageContent,
} from 'common/util/paste.ts';
import { createEditor } from 'external/src/editor/createEditor.ts';

test('Paste plain text', () => {
  const editor = createEditor();
  editor.insertData({ getData: () => simpleText.html } as any);
  expect(editor.children).toStrictEqual(simpleText.output);
});

test('Paste HTML', () => {
  const editor = createEditor();
  editor.insertData({ getData: () => simpleHTML.html } as any);
  expect(editor.children).toStrictEqual(simpleHTML.output);
});

test(`Paste google docs content`, () => {
  const editor = createEditor();
  editor.insertData({ getData: () => googleDocs.html } as any);
  expect(editor.children).toStrictEqual(googleDocs.output);
});

test(`Paste google docs nested bullets`, () => {
  const editor = createEditor();
  editor.insertData({ getData: () => googleDocsNestedBullets.html } as any);
  expect(editor.children).toStrictEqual(googleDocsNestedBullets.output);
});

test(`Paste Microsoft word content`, () => {
  const editor = createEditor();
  editor.insertData({ getData: () => microsoftWord.html } as any);
  expect(editor.children).toStrictEqual(microsoftWord.output);
});

test('Paste google docs content into code tag', () => {
  const editor = createEditor();
  Transforms.insertNodes(
    editor,
    createMessageNode(MessageNodeType.CODE, {
      children: [{ text: '' }],
    }),
    { select: true },
  );
  editor.insertData({
    getData: () => googleDocs.html,
  } as any);
  expect(editor.children).toStrictEqual(googleDocs.outputInCode);
});

// Note - we cannot use editor.insertData for this test
// This is because Slate rules forbid the slack_mention block element inside the p, so will remove
// This does not matter because this logic is used for importing slack messages
// After the transform, we convert the slack_mention into a Slate-acceptable inline mention element
test('Transform slack message', () => {
  const slackMessage =
    'hey <span class="s-mention s-user">@U01FKGKCF62</span>, <a href="https://radical.phacility.com/">phabricator homepage</a>, if anyone didn&#x27;t know about it<br>also here&#x27;s another line';
  const parsedHtml = new DOMParser().parseFromString(
    `<html><body>${slackMessage}</body></html>`,
    'text/html',
  );
  const deserialized = deserializeElementToMessageContent(
    parsedHtml.body,
    false,
  );
  expect(deserialized).toStrictEqual([
    {
      text: 'hey ',
    },
    {
      type: 'slack_mention',
      slackUserID: 'U01FKGKCF62',
      children: [
        {
          text: 'U01FKGKCF62',
        },
      ],
    },
    {
      text: ', ',
    },
    {
      children: [{ text: 'phabricator homepage' }],
      type: 'link',
      url: 'https://radical.phacility.com/',
    },
    {
      text: ", if anyone didn't know about it",
    },
    {
      text: '\n',
    },
    {
      text: "also here's another line",
    },
  ]);

  // Replace the slack mention with a regular mention
  deserialized[1] = createMentionNode('U01FKGKCF62', 'U01FKGKCF62');

  const transformed = cleanPastedNodes(deserialized);
  expect(transformed).toStrictEqual([
    {
      type: 'p',
      children: [
        {
          text: 'hey ',
        },
        {
          type: 'mention',
          user: { id: 'U01FKGKCF62' },
          children: [
            {
              text: '@U01FKGKCF62',
            },
          ],
        },
        {
          text: ', ',
        },
        {
          children: [{ text: 'phabricator homepage' }],
          type: 'link',
          url: 'https://radical.phacility.com/',
        },
        {
          text: ", if anyone didn't know about it",
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: "also here's another line",
        },
      ],
    },
  ]);
});
