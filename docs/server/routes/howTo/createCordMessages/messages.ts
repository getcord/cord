export default {
  basicMessage: [
    {
      type: 'p',
      children: [
        {
          text: 'This is the text of the message',
        },
      ],
    },
  ],
  messageWithFormatting: [
    {
      type: 'p',
      children: [
        {
          text: 'This is unformatted. ',
        },
        {
          text: 'This text is bold.',
          bold: true,
        },
        {
          text: ' ',
        },
        {
          text: 'This is underlined.',
          underline: true,
        },
        {
          text: ' ',
        },
        {
          text: 'This is italic.',
          italic: true,
        },
        {
          text: ' ',
        },
        {
          text: 'I put',
        },
        {
          text: ' ',
        },
        {
          text: 'everything',
          bold: true,
          underline: true,
          italic: true,
        },
        {
          text: ' ',
        },
        {
          text: 'on a bagel. 🥯',
        },
      ],
    },
  ],
  linkMessage: [
    {
      type: 'p',
      children: [
        {
          type: 'link',
          url: 'https://docs.cord.com/',
          children: [{ text: 'Get your docs here!' }],
        },
      ],
    },
  ],
  atMentionMessage: (userID: string, userName: string) => [
    {
      type: 'p',
      children: [
        { text: 'Hi, ' },
        {
          type: 'mention',
          user: {
            id: userID,
          },
          children: [
            {
              text: '@' + userName,
            },
          ],
        },
        { text: '!' },
      ],
    },
  ],
  listMessage: [
    {
      type: 'bullet',
      children: [{ type: 'p', children: [{ text: 'Bullet list' }] }],
    },
    {
      type: 'bullet',
      children: [{ type: 'p', children: [{ text: 'Two items!' }] }],
    },
  ],
  numberedListMessage: [
    {
      type: 'number_bullet',
      children: [{ type: 'p', children: [{ text: 'foo' }] }],
      bulletNumber: 1,
    },
    {
      type: 'number_bullet',
      children: [{ type: 'p', children: [{ text: 'bar' }] }],
      bulletNumber: 2,
    },
    {
      type: 'number_bullet',
      children: [{ type: 'p', children: [{ text: 'baz' }] }],
      bulletNumber: 3,
    },
  ],
  codeBlockMessage: [
    {
      type: 'p',
      children: [
        { text: "Here's a code block that will work forever, literally!" },
      ],
    },
    {
      type: 'code',
      children: [{ text: 'for (;;);' }],
    },
    {
      type: 'p',
      children: [{ text: "Here's something after the code block" }],
    },
  ],
  quoteMessage: [
    {
      type: 'p',
      children: [{ text: 'Is it not written...' }],
    },
    {
      type: 'quote',
      children: [
        {
          text: "Don't go out with a wet head, you'll catch cold",
        },
      ],
    },
    {
      type: 'p',
      children: [{ text: '- Lu Tze, quoting Mrs. Cosmopilite' }],
    },
  ],

  withClassMessage: [
    {
      type: 'p',
      class: 'purple',
      children: [
        { text: 'Please ' },
        { text: 'read the documentation ', class: 'important' },
        { text: 'carefully.' },
      ],
    },
  ],
};
