/* eslint-disable @cspell/spellchecker */
import { MessageNodeType } from '@cord-sdk/types';
import type { MessageContent } from '@cord-sdk/types';
import { markdownToNode } from 'src/messageFormatter/mdToNode';

type TestCase = {
  name: string;
  mdMessage: string;
  nodeMessage: MessageContent;
};

const testCases: TestCase[] = [
  {
    name: 'Simple text',
    mdMessage: `This is some text`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is some text',
          },
        ],
      },
    ],
  },
  {
    name: 'Single asterisk',
    mdMessage: `This is *some text*`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            italic: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Double asterisk',
    mdMessage: `This is **some text**`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            bold: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Triple asterisk',
    mdMessage: `This is ***some text***`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            bold: true,
            italic: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Single underscore',
    mdMessage: `This is _some text_`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            italic: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Double underscore',
    mdMessage: `This is __some text__`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            bold: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Triple underscore',
    mdMessage: `This is ___some text___`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some text',
            bold: true,
            italic: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Nested emphasis',
    mdMessage: 'This _is **really** important_ stuff',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'This ' },
          { text: 'is ', italic: true },
          { text: 'really', italic: true, bold: true },
          { text: ' important', italic: true },
          { text: ' stuff' },
        ],
      },
    ],
  },
  {
    name: 'Soft break',
    mdMessage: `This is a
test.`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is a' }, { text: 'test.' }],
      },
    ],
  },
  {
    name: 'Hard break',
    mdMessage: `This is a \\
test.`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is a \\' }, { text: 'test.' }],
      },
    ],
  },
  {
    name: 'Inline code',
    mdMessage: 'This is `some code`',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'some code',
            code: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Escaped separators',
    mdMessage: 'This is \\`unformatted \\* code \\*_except this_',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'This is `unformatted * code *' },
          { text: 'except this', italic: true },
        ],
      },
    ],
  },
  {
    name: 'Multiple paragraphs',
    mdMessage: 'This is multiple paragraphs.\n\nHow does it work?',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is multiple paragraphs.' }],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'How does it work?' }],
      },
    ],
  },
  {
    name: 'Simple code fence',
    mdMessage: `This is some text

\`\`\`
And this is some code
\`\`\``,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is some text' }],
      },
      {
        type: MessageNodeType.CODE,
        children: [{ text: 'And this is some code\n' }],
      },
    ],
  },
  {
    name: 'Named code fence',
    mdMessage: `This is some text

\`\`\` javascript
And this is some code
\`\`\``,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is some text' }],
      },
      {
        type: MessageNodeType.CODE,
        children: [{ text: 'And this is some code\n' }],
      },
    ],
  },
  {
    name: 'Code block',
    mdMessage: `This is some text

    And this is some code
    This is some more code`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'This is some text' }],
      },
      {
        type: MessageNodeType.CODE,
        children: [{ text: 'And this is some code\nThis is some more code\n' }],
      },
    ],
  },
  {
    name: 'Simple link',
    mdMessage: 'Here is [the text](of.this.url)',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'Here is ',
          },
          {
            type: MessageNodeType.LINK,
            url: 'of.this.url',
            children: [
              {
                text: 'the text',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Link with marks',
    mdMessage: 'Here is [the **_really_ important** text](of.this.url)',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'Here is ',
          },
          {
            type: MessageNodeType.LINK,
            url: 'of.this.url',
            children: [
              {
                text: 'the ',
              },
              {
                text: 'really',
                bold: true,
                italic: true,
              },
              {
                text: ' important',
                bold: true,
              },
              {
                text: ' text',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Simple block quote',
    mdMessage: '> This is a block quote',
    nodeMessage: [
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'This is a block quote',
          },
        ],
      },
    ],
  },
  {
    name: 'Block quote in a new line',
    mdMessage: `This is the first line,
> This is a block quote`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is the first line,',
          },
        ],
      },
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'This is a block quote',
          },
        ],
      },
    ],
  },
  {
    name: 'Block quote in a new line with emphasis',
    mdMessage: `This is _the_ first line,
> This is a **block _quote_**`,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'This is ',
          },
          {
            text: 'the',
            italic: true,
          },
          {
            text: ' first line,',
          },
        ],
      },
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'This is a ',
          },
          {
            text: 'block ',
            bold: true,
          },
          {
            text: 'quote',
            bold: true,
            italic: true,
          },
        ],
      },
    ],
  },
  {
    name: 'Simple numbered bullet list',
    mdMessage: `1. One
  2. Two
  3. Buckle my shoe`,
    nodeMessage: [
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'One',
              },
            ],
          },
        ],
        bulletNumber: 1,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Two',
              },
            ],
          },
        ],
        bulletNumber: 2,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Buckle my shoe',
              },
            ],
          },
        ],
        bulletNumber: 3,
      },
    ],
  },
  {
    name: 'Numbered bullet list with emphasis and code',
    mdMessage: `1. Number _one **in** the_ \`list\`,
2. Two [with a link](www.url.com)
3. Buckle **my shoe**`,
    nodeMessage: [
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Number ',
              },
              {
                text: 'one ',
                italic: true,
              },
              {
                text: 'in',
                italic: true,
                bold: true,
              },
              {
                text: ' the',
                italic: true,
              },
              {
                text: ' ',
              },
              {
                text: 'list',
                code: true,
              },
              {
                text: ',',
              },
            ],
          },
        ],
        bulletNumber: 1,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Two ',
              },
              {
                type: MessageNodeType.LINK,
                url: 'www.url.com',
                children: [
                  {
                    text: 'with a link',
                  },
                ],
              },
            ],
          },
        ],
        bulletNumber: 2,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Buckle ',
              },
              {
                text: 'my shoe',
                bold: true,
              },
            ],
          },
        ],
        bulletNumber: 3,
      },
    ],
  },
  {
    name: 'Message with all types',
    mdMessage: `**Here's a message to showcase some formatting**

There are _a few things to **demonstrate**_:

> Aside from some \`inline\` formatting..

- Bullet points - _such as this_
* quotes as you can see above
* new lines (which can be seen throughout this example)
- [**lovely _links_**](www.this-should-format.com)

As well as this, we can also format

\`\`\`javascript
const codeBlock = "and declare the language!"
\`\`\`

I'm going to start \`numbering things\`:
1. One - with **some** formatting
2. Two - let's put [a link!?](www.url.com)
3. Buckle **_my_ shoe**
    `,
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: "Here's a message to showcase some formatting",
            bold: true,
          },
        ],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'There are ',
          },
          {
            text: 'a few things to ',
            italic: true,
          },
          {
            text: 'demonstrate',
            italic: true,
            bold: true,
          },
          {
            text: ':',
          },
        ],
      },
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'Aside from some ',
          },
          {
            text: 'inline',
            code: true,
          },
          {
            text: ' formatting..',
          },
        ],
      },
      {
        type: MessageNodeType.BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Bullet points - ',
              },
              {
                text: 'such as this',
                italic: true,
              },
            ],
          },
        ],
      },
      {
        type: MessageNodeType.BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'quotes as you can see above',
              },
            ],
          },
        ],
      },
      {
        type: MessageNodeType.BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'new lines (which can be seen throughout this example)',
              },
            ],
          },
        ],
      },
      {
        type: MessageNodeType.BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                type: MessageNodeType.LINK,
                url: 'www.this-should-format.com',
                children: [
                  {
                    text: 'lovely ',
                    bold: true,
                  },
                  {
                    text: 'links',
                    bold: true,
                    italic: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'As well as this, we can also format',
          },
        ],
      },
      {
        type: MessageNodeType.CODE,
        children: [
          {
            text: 'const codeBlock = "and declare the language!"\n',
          },
        ],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: "I'm going to start ",
          },
          {
            text: 'numbering things',
            code: true,
          },
          {
            text: ':',
          },
        ],
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'One - with ',
              },
              {
                text: 'some',
                bold: true,
              },
              {
                text: ' formatting',
              },
            ],
          },
        ],
        bulletNumber: 1,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: "Two - let's put ",
              },
              {
                type: MessageNodeType.LINK,
                url: 'www.url.com',
                children: [
                  {
                    text: 'a link!?',
                  },
                ],
              },
            ],
          },
        ],
        bulletNumber: 2,
      },
      {
        type: MessageNodeType.NUMBER_BULLET,
        children: [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [
              {
                text: 'Buckle ',
              },
              {
                text: 'my',
                bold: true,
                italic: true,
              },
              {
                text: ' shoe',
                bold: true,
              },
            ],
          },
        ],
        bulletNumber: 3,
      },
    ],
  },
  {
    name: 'Block quote with embedded numbered list',
    mdMessage: `> This is a block quote with list
    > 1. Number one
    > 2. Number two`,
    nodeMessage: [
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'This is a block quote with list',
          },
          {
            type: MessageNodeType.NUMBER_BULLET,
            children: [
              {
                type: MessageNodeType.PARAGRAPH,
                children: [
                  {
                    text: 'Number one',
                  },
                ],
              },
            ],
            bulletNumber: 1,
          },
          {
            type: MessageNodeType.NUMBER_BULLET,
            children: [
              {
                type: MessageNodeType.PARAGRAPH,
                children: [
                  {
                    text: 'Number two',
                  },
                ],
              },
            ],
            bulletNumber: 2,
          },
        ],
      },
    ],
  },
  {
    name: 'Block quote with multiple lines',
    mdMessage: `> This is a block quote with lines
    > Line one
    > Line two`,
    nodeMessage: [
      {
        type: MessageNodeType.QUOTE,
        children: [
          {
            text: 'This is a block quote with lines',
          },
          {
            text: 'Line one',
          },
          {
            text: 'Line two',
          },
        ],
      },
    ],
  },
  {
    name: 'Mention - simple',
    mdMessage: 'Hello my friend <@bilbo>, how are you?',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'Hello my friend ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: 'bilbo' },
            children: [{ text: '@bilbo' }],
          },
          { text: ', how are you?' },
        ],
      },
    ],
  },
  {
    name: 'Mention - complex',
    mdMessage: '<@@\\><> is \\<@cool>',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            type: MessageNodeType.MENTION,
            user: { id: '@><' },
            children: [{ text: '@@><' }],
          },
          {
            text: ' is <@cool>',
          },
        ],
      },
    ],
  },
  {
    name: 'Mention - marked up',
    mdMessage: 'This is **<@boldy> oldy**, this is <@**not**>',
    nodeMessage: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'This is ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: 'boldy' },
            children: [{ text: '@boldy' }],
          },
          { text: ' oldy', bold: true },
          { text: ', this is ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: '**not**' },
            children: [{ text: '@**not**' }],
          },
        ],
      },
    ],
  },
];

describe('Message Parser: markdown -> message content', () => {
  test.each(testCases)('$name', ({ mdMessage, nodeMessage }) => {
    expect(markdownToNode(mdMessage)).toEqual(nodeMessage);
  });
});
