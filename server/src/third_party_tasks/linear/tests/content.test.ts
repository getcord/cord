import { convertMessageContentToMarkdown } from 'server/src/third_party_tasks/linear/util.ts';
import { MessageNodeType } from 'common/types/index.ts';

const FOOTER_TEXT = 'footer';

describe('Testing document format parsing', () => {
  test('Complex message', () => {
    expect(
      convertMessageContentToMarkdown(
        [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              { text: 'task with ' },
              { text: 'bold', bold: true },
              { text: ', ' },
              { text: 'italic', italic: true },
              { text: ', ' },
              { text: 'underlined', underline: true },
              { text: ', ' },
              { text: ' text, ' },
              {
                type: MessageNodeType.LINK,
                url: 'https://andrei.codes',
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
              {
                type: MessageNodeType.PARAGRAPH,
                children: [{ text: 'a todo' }],
              },
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
      `task with **bold**, *italic*, underlined,  text, [a link](https://andrei.codes), mentioning @Jozef and assigned to +Andrei, and some things:\n\n* a bullet point\n\n\n* [ ] a todo\n\n\n* [ ] another todo\n\n\n1. a numbered list\n\n\n1. another item in the numbered list\n\n\n> a quote\nanother line in the quote\n\n\n\n${FOOTER_TEXT}`,
    );
  });

  test('bold and italics with multiple words', () => {
    expect(
      convertMessageContentToMarkdown(
        [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [{ text: 'bold and italics', bold: true, italic: true }],
          },
        ],
        FOOTER_TEXT,
      ),
    ).toStrictEqual(`***bold and italics***\n\n\n\n${FOOTER_TEXT}`);
  });

  test('bold and italics with multiple words and whitespaces', () => {
    expect(
      convertMessageContentToMarkdown(
        [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              { text: ' bold and italics ', bold: true, italic: true },
            ],
          },
        ],
        FOOTER_TEXT,
      ),
    ).toStrictEqual(` ***bold and italics*** \n\n\n\n${FOOTER_TEXT}`);
  });

  test('code snippet', () => {
    expect(
      convertMessageContentToMarkdown(
        [
          {
            type: MessageNodeType.CODE,
            children: [{ text: `console.log('hello world')` }],
          },
        ],
        FOOTER_TEXT,
      ),
    ).toStrictEqual(`\`console.log('hello world')\`\n\n${FOOTER_TEXT}`);
  });

  test('Embed link with special characters', () => {
    expect(
      convertMessageContentToMarkdown(
        [
          {
            type: MessageNodeType.LINK,
            children: [{ text: `Here's my ] [ link` }],
            url: 'https://en.wikipedia.org/wiki/Metallica_(album)',
          },
        ],
        FOOTER_TEXT,
      ),
    ).toStrictEqual(
      `[Here's my \\] \\[ link](https://en.wikipedia.org/wiki/Metallica_\\(album\\))\n\n${FOOTER_TEXT}`,
    );
  });
});
