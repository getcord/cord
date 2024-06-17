import type { MessageContent } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { slackMrkdwnFromMessageContentImpl } from 'server/src/slack/mrkdwnImpl.ts';

const toMrkdwn = (content: MessageContent) =>
  slackMrkdwnFromMessageContentImpl(content, {
    async lookUpSlackUserID(userID) {
      return userID !== 'null' ? `slack-${userID}` : null;
    },
  });

test('empty', async () => {
  expect(await toMrkdwn([])).toBe('');
  expect(await toMrkdwn([{ text: '' }])).toBe('');
  expect(await toMrkdwn([{ text: '', bold: true }])).toBe('');
  expect(
    await toMrkdwn([{ type: MessageNodeType.PARAGRAPH, children: [] }]),
  ).toBe('');
  expect(
    await toMrkdwn([
      { type: MessageNodeType.PARAGRAPH, children: [{ text: '' }] },
    ]),
  ).toBe('');
  expect(
    await toMrkdwn([
      { type: MessageNodeType.PARAGRAPH, children: [{ text: '', bold: true }] },
    ]),
  ).toBe('');
});

test('single text node', async () => {
  expect(await toMrkdwn([{ text: 'hello world' }])).toBe('hello world');
});

test('single text node with formatting', async () => {
  expect(await toMrkdwn([{ text: 'hello world', bold: true }])).toBe(
    '*hello world*',
  );
  expect(await toMrkdwn([{ text: 'hello world', italic: true }])).toBe(
    '_hello world_',
  );
  expect(
    await toMrkdwn([{ text: 'hello world', bold: true, italic: true }]),
  ).toBe('_*hello world*_');
});

test('text nodes with formatting', async () => {
  expect(
    await toMrkdwn([{ text: 'hello ' }, { text: 'world', bold: true }]),
  ).toBe('hello *world*');

  // We sometime need to inject spaces to make formatting work:
  // 'hello' + '*world*' => 'hello *world*'
  expect(
    await toMrkdwn([{ text: 'hello' }, { text: 'world', bold: true }]),
  ).toBe('hello\u200b*world*');

  expect(
    await toMrkdwn([
      { text: 'hello', italic: true },
      { text: 'world', bold: true },
    ]),
  ).toBe('_hello_\u200b*world*');

  expect(
    await toMrkdwn([
      { text: 'hello', italic: true },
      { text: 'world', bold: true, italic: true },
    ]),
  ).toBe('_hello\u200b*world*_');

  expect(
    await toMrkdwn([
      { text: 'hello', bold: true, italic: true },
      { text: 'world', bold: true },
    ]),
  ).toBe('_*hello*_\u200b*world*');
});

test('formatting characters', async () => {
  for (const bold of [false, true]) {
    for (const italic of [false, true]) {
      const italicFormatting = italic ? '_' : '';
      const boldFormatting = bold ? '*' : '';
      expect(await toMrkdwn([{ text: '*', bold, italic }])).toBe(
        `${italicFormatting}${boldFormatting}<!date^00000000^{_}|*>${boldFormatting}${italicFormatting}`,
      );
    }
  }
});

test('user mention', async () => {
  expect(
    await toMrkdwn([
      { text: 'foo ' },
      {
        type: MessageNodeType.MENTION,
        user: { id: 'myUserId' },
        children: [{ text: 'hello' }],
      },
      { text: ' bar' },
    ]),
  ).toBe('foo <@slack-myUserId> bar');

  expect(
    await toMrkdwn([
      { text: 'foo ' },
      {
        type: MessageNodeType.MENTION,
        user: { id: 'null' },
        children: [{ text: 'hello' }],
      },
      { text: ' bar' },
    ]),
  ).toBe('foo hello bar');
});

test('line break in segment', async () => {
  expect(
    await toMrkdwn([
      { text: 'hello\n', bold: true },
      { text: 'world', bold: true },
    ]),
  ).toBe('*hello*\n*world*');

  expect(
    await toMrkdwn([
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'hello', bold: true }],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'world', bold: true }],
      },
    ]),
  ).toBe('*hello*\n*world*');

  expect(await toMrkdwn([{ text: 'hello\nworld', bold: true }])).toBe(
    '*hello*\n*world*',
  );
});
