export const simpleText = {
  html: `hello`,
  output: [
    {
      type: 'p',
      children: [
        {
          text: 'hello',
        },
      ],
    },
  ],
};

export const simpleHTML = {
  html: `<html><body><p>lorem ipsum <strong>dolor</strong></p><p><em><u>important text</u></em></p><ul><li>foo bar</li><li><strong>baz baz baz</strong></li></ul><pre>this is some code</pre><blockquote>this is a quote - Abraham Lincoln - Michael Scott</blockquote><p>and one final paragraph with a<a href="https://en.wikipedia.org/wiki/The_Diamond_Age">link to Wikipedia</a>omg so cool</p><p>but <a href="javascript:alert('hey')">this is a link</a> that shouldn't work</p></body></html>
  `,
  output: [
    {
      type: 'p',
      children: [
        {
          text: 'lorem ipsum ',
        },
        {
          text: 'dolor',
          bold: true,
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: 'important text',
          italic: true,
        },
      ],
    },
    {
      type: 'bullet',
      indent: 0,
      children: [
        {
          children: [
            {
              text: 'foo bar',
            },
          ],
          type: 'p',
        },
      ],
    },
    {
      type: 'bullet',
      indent: 0,
      children: [
        {
          children: [
            {
              text: 'baz baz baz',
              bold: true,
            },
          ],
          type: 'p',
        },
      ],
    },
    {
      type: 'code',
      children: [
        {
          text: 'this is some code',
        },
      ],
    },
    {
      type: 'quote',
      children: [
        {
          type: 'p',
          children: [
            {
              text: 'this is a quote - Abraham Lincoln - Michael Scott',
            },
          ],
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: 'and one final paragraph with a',
        },
        {
          type: 'link',
          url: 'https://en.wikipedia.org/wiki/The_Diamond_Age',
          children: [{ text: 'link to Wikipedia' }],
        },
        {
          text: 'omg so cool',
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: "but this is a link that shouldn't work",
        },
      ],
    },
  ],
};

export const simpleTextWithMentions = {
  html: `hey look at this @rolo! this@gillian shouldnt mention. @henry shouldnt either because could be >1 users. @gillian`,
  output: [
    {
      type: 'p',
      children: [
        {
          text: 'hey look at this ',
        },
        {
          type: 'mention',
          children: [
            {
              text: '@rolo',
            },
          ],
          user: {
            id: '2',
          },
        },
        {
          text: '! this@gillian shouldnt mention. @henry shouldnt either because could be >1 users. ',
        },
        {
          type: 'mention',
          children: [
            {
              text: '@gillian',
            },
          ],
          user: {
            id: '1',
          },
        },
        {
          text: ' ',
        },
      ],
    },
  ],
};

export const simpleTextWithHarderMentions = {
  html: `hey look at this @beyoncé! and @daniel day-lewis and @dick van dyke`,
  output: [
    {
      type: 'p',
      children: [
        {
          text: 'hey look at this ',
        },
        {
          type: 'mention',
          children: [
            {
              text: '@Beyoncé Knowles',
            },
          ],
          user: {
            id: '3',
          },
        },
        {
          text: '! and ',
        },
        {
          type: 'mention',
          children: [
            {
              text: '@Daniel Day-Lewis',
            },
          ],
          user: {
            id: '1',
          },
        },
        {
          text: ' and ',
        },
        {
          type: 'mention',
          children: [
            {
              text: '@Dick Van Dyke',
            },
          ],
          user: {
            id: '2',
          },
        },
        {
          text: ' ',
        },
      ],
    },
  ],
};

export const simpleHTMLWithMentions = {
  html: `<html><body><p>lorem ipsum <strong>dolor</strong></p><p><em><u>important text</u></em></p><ul><li>foo bar @gillian</li><li><strong>baz baz baz</strong></li><li>@gillian @henry @badmention @rolo</li></ul><pre>this is some code</pre><blockquote>this is a quote - Abraham Lincoln - Michael Scott @gillian</blockquote><p>and one final paragraph with a<a href="https://en.wikipedia.org/wiki/The_Diamond_Age">link to Wikipedia</a>omg so cool @gillian</p><p>but <a href="javascript:alert('hey')">this is a link</a> that shouldn't work</p></body></html>
  `,
  output: [
    {
      type: 'p',
      children: [
        {
          text: 'lorem ipsum ',
        },
        {
          text: 'dolor',
          bold: true,
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: 'important text',
          italic: true,
        },
      ],
    },
    {
      type: 'bullet',
      indent: 0,
      children: [
        {
          children: [
            {
              text: 'foo bar ',
            },
            {
              type: 'mention',
              children: [{ text: '@gillian' }],
              user: { id: '1' },
            },
            {
              text: ' ',
            },
          ],
          type: 'p',
        },
      ],
    },
    {
      type: 'bullet',
      indent: 0,
      children: [
        {
          children: [
            {
              text: 'baz baz baz',
              bold: true,
            },
          ],
          type: 'p',
        },
      ],
    },
    {
      type: 'bullet',
      indent: 0,
      children: [
        {
          children: [
            {
              text: '',
            },
            {
              type: 'mention',
              children: [{ text: '@gillian' }],
              user: { id: '1' },
            },
            {
              text: ' ',
            },
            {
              type: 'mention',
              children: [{ text: '@henry' }],
              user: { id: '3' },
            },
            {
              text: ' @badmention ',
            },
            {
              type: 'mention',
              children: [{ text: '@rolo' }],
              user: { id: '2' },
            },
            {
              text: ' ',
            },
          ],
          type: 'p',
        },
      ],
    },
    {
      type: 'code',
      children: [
        {
          text: 'this is some code',
        },
      ],
    },
    {
      type: 'quote',
      children: [
        {
          text: 'this is a quote - Abraham Lincoln - Michael Scott ',
        },
        {
          type: 'mention',
          children: [{ text: '@gillian' }],
          user: { id: '1' },
        },
        {
          text: ' ',
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: 'and one final paragraph with a',
        },
        {
          type: 'link',
          url: 'https://en.wikipedia.org/wiki/The_Diamond_Age',
          children: [{ text: 'link to Wikipedia' }],
        },
        {
          text: 'omg so cool ',
        },
        {
          type: 'mention',
          children: [{ text: '@gillian' }],
          user: { id: '1' },
        },
        {
          text: ' ',
        },
      ],
    },
    {
      type: 'p',
      children: [
        {
          text: "but this is a link that shouldn't work",
        },
      ],
    },
  ],
};
