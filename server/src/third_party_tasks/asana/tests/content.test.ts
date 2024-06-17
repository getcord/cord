import { MessageNodeType } from 'common/types/index.ts';
import { messageContentToAsanaHtml } from 'server/src/third_party_tasks/asana/util.ts';

const FOOTER_TEXT = 'footer';

test('document format', () => {
  expect(
    messageContentToAsanaHtml(
      [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            { text: 'task with ' },
            { bold: true, text: 'bold' },
            { text: ', ' },
            { text: 'italic', italic: true },
            { text: ', ' },
            { text: 'underlined', underline: true },
            { text: ' text, ' },
            {
              type: MessageNodeType.LINK,
              url: 'https://andrei.codes/',
              children: [{ text: 'a link' }],
            },
            { text: ', mentioning ' },
            {
              type: MessageNodeType.MENTION,
              user: { id: 'd6ed5560-6400-48c9-8e84-4e5da56663fc' },
              children: [{ text: '@Jozef' }],
            },
            { text: ' and assigned to ' },
            {
              type: MessageNodeType.ASSIGNEE,
              user: { id: '112278fc-c8f4-45a6-832b-880be29e0cd0' },
              children: [{ text: '+Andrei' }],
            },
            { text: ', and some things:' },
          ],
        },
        {
          type: MessageNodeType.BULLET,
          children: [
            {
              type: MessageNodeType.PARAGRAPH,
              children: [{ text: 'a bullet point' }],
            },
          ],
        },
        {
          done: false,
          type: MessageNodeType.TODO,
          todoID: '1860e4f6-6f28-45f1-95aa-046e3162d64d',
          children: [
            { type: MessageNodeType.PARAGRAPH, children: [{ text: 'a todo' }] },
          ],
        },
        {
          done: false,
          type: MessageNodeType.TODO,
          todoID: 'b48f4915-5b03-4a3d-920e-6dd43c5b8072',
          children: [
            {
              type: MessageNodeType.PARAGRAPH,
              children: [{ text: 'another todo' }],
            },
          ],
        },
        {
          type: MessageNodeType.NUMBER_BULLET,
          children: [
            {
              type: MessageNodeType.PARAGRAPH,
              children: [{ text: 'a numbered list' }],
            },
          ],
          bulletNumber: 1,
        },
        {
          type: MessageNodeType.NUMBER_BULLET,
          children: [
            {
              type: MessageNodeType.PARAGRAPH,
              children: [{ text: 'another item in the numbered list' }],
            },
          ],
          bulletNumber: 2,
        },
        {
          type: MessageNodeType.QUOTE,
          children: [{ text: 'a quote\nanother line in the quote' }],
        },
      ],
      FOOTER_TEXT,
    ),
  ).toStrictEqual(
    `<body>task with <strong>bold</strong>, <em>italic</em>, <u>underlined</u> text, <a href="https://andrei.codes/">a link</a>, mentioning @Jozef and assigned to +Andrei, and some things:
<ul><li>a bullet point
</li><li>a todo
</li><li>another todo
</li></ul><ol><li>a numbered list
</li><li>another item in the numbered list
</li></ol>a quote
another line in the quote

${FOOTER_TEXT}</body>`,
  );

  expect(
    messageContentToAsanaHtml(
      [
        { type: MessageNodeType.PARAGRAPH, children: [{ text: 'task' }] },
        { type: MessageNodeType.PARAGRAPH, children: [{ text: '' }] },
      ],
      FOOTER_TEXT,
    ),
  ).toStrictEqual(`<body>task\n\n\n${FOOTER_TEXT}</body>`);

  expect(
    messageContentToAsanaHtml(
      [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [{ text: '<strong>This should not be bold</strong>' }],
        },
      ],
      FOOTER_TEXT,
    ),
  ).toStrictEqual(
    `<body>&lt;strong&gt;This should not be bold&lt;/strong&gt;\n\n${FOOTER_TEXT}</body>`,
  );

  expect(
    messageContentToAsanaHtml(
      [
        {
          type: MessageNodeType.CODE,
          children: [{ text: 'return 42;' }],
        },
      ],
      FOOTER_TEXT,
    ),
  ).toStrictEqual(`<body><code>return 42;</code>\n${FOOTER_TEXT}</body>`);
});
