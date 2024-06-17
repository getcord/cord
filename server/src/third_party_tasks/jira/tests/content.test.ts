import { MessageNodeType } from 'common/types/index.ts';
import { messageContentToAtlassianDocument } from 'server/src/third_party_tasks/jira/util.ts';

const FOOTER_TEXT = 'footer';
const FORMATTED_FOOTER = [
  {
    type: 'text',
    text: FOOTER_TEXT,
  },
];

test('document format', () => {
  expect(
    messageContentToAtlassianDocument(
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
      FORMATTED_FOOTER,
    ),
  ).toStrictEqual({
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'task with ', marks: [] },
          { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
          { type: 'text', text: ', ', marks: [] },
          { type: 'text', text: 'italic', marks: [{ type: 'em' }] },
          { type: 'text', text: ', ', marks: [] },
          { type: 'text', text: 'underlined', marks: [{ type: 'underline' }] },
          { type: 'text', text: ' text, ', marks: [] },
          {
            type: 'text',
            text: 'a link',
            marks: [{ type: 'link', attrs: { href: 'https://andrei.codes/' } }],
          },
          { type: 'text', text: ', mentioning ', marks: [] },
          { type: 'text', text: '@Jozef' },
          { type: 'text', text: ' and assigned to ', marks: [] },
          { type: 'text', text: '+Andrei' },
          { type: 'text', text: ', and some things:', marks: [] },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'a bullet point', marks: [] }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'a todo', marks: [] }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'another todo', marks: [] }],
              },
            ],
          },
        ],
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'a numbered list', marks: [] }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'another item in the numbered list',
                    marks: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'a quote\nanother line in the quote',
                marks: [],
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: FOOTER_TEXT,
          },
        ],
      },
    ],
  });

  expect(
    messageContentToAtlassianDocument(
      [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [{ text: '' }],
        },
      ],
      FORMATTED_FOOTER,
    ),
  ).toStrictEqual({
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ text: FOOTER_TEXT, type: 'text' }],
      },
    ],
  });

  expect(
    messageContentToAtlassianDocument(
      [
        { type: MessageNodeType.PARAGRAPH, children: [{ text: 'task' }] },
        { type: MessageNodeType.PARAGRAPH, children: [{ text: '' }] },
      ],
      FORMATTED_FOOTER,
    ),
  ).toStrictEqual({
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [],
            text: 'task',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ text: FOOTER_TEXT, type: 'text' }],
      },
    ],
  });
});
