import { validateMessageContent } from 'server/src/message/util/validateMessageContent.ts';

describe('Validate message content', () => {
  test('invalid string message', async () => {
    const msg = "Oh come on, a little string-y wing-y wouldn't hurt";
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('invalid undefined message', async () => {
    const msg = undefined;
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('invalid null message', async () => {
    const msg = null;
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('empty object message', async () => {
    const msg = {};

    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('empty array message', async () => {
    const msg: any = [];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  // This is a test case for something that seems plausible (i.e. something a
  // dev might cook up while mucking about) but which isn't valid
  test('right-looking but invalid message', async () => {
    const msg: any = [{ text: 'foo bar baz' }];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('valid paragraph message', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            text: 'foo bar baz',
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid paragraph message with invalid text', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            text: 'foo bar baz',
            marquee: true,
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('valid paragraph message with valid formatted text', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            text: 'foo bar baz',
            bold: true,
            underline: true,
            italic: true,
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid paragraph message with valid code text', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            text: 'foo bar baz',
            code: true,
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid paragraph message with an emoji', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            text: '😁',
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('invalid paragraph within paragraph message', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            type: 'p',
            children: [
              {
                text: 'paragraph-ception',
              },
            ],
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('invalid untyped message', async () => {
    const msg: any = [
      {
        children: [
          {
            text: 'foo bar baz',
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('valid @-mention message', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          { text: 'Hey, ' },
          {
            type: 'mention',
            user: { id: '2b5d5da8-2b6c-4ca4-aaad-1c4466b88ab5' },
            children: [{ text: '@Sample User' }],
          },
          { text: '!' },
        ],
      },
      {
        type: 'p',
        children: [{ text: 'Nice work! Your Cord demo is ready.' }],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid task assignee message', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          { text: '' },
          {
            type: 'assignee',
            user: { id: '58fab40b-3302-43aa-9c34-3b20ce61ba38' },
            children: [{ text: '+Oscar' }],
          },
          { text: " here's a task for you!" },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid quote message', async () => {
    const msg: any = [{ type: 'quote', children: [{ text: "I'm a quote" }] }];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid bullet list message', async () => {
    const msg: any = [
      {
        type: 'bullet',
        children: [{ type: 'p', children: [{ text: 'Bullet list' }] }],
      },
      {
        type: 'bullet',
        children: [{ type: 'p', children: [{ text: 'Two items!' }] }],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid number bullet list message', async () => {
    const msg: any = [
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
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid number bullet list message with invalid @-mention child', async () => {
    const msg: any = [
      {
        type: 'bullet',
        children: [
          {
            type: 'mention',
            user: { id: '58fab40b-3302-43aa-9c34-3b20ce61ba38' },
            children: [{ text: '@Oscar' }],
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('valid message with code blocks', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [{ text: "Here's a useful code block for you!" }],
      },
      {
        type: 'code',
        children: [{ text: 'for (;;);' }],
      },
      {
        type: 'p',
        children: [{ text: "Here's something after the code block" }],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });

  test('valid message with experimental custom rendering', async () => {
    const msg: any = [
      { type: 'p', children: [{ text: 'You might like this button!' }] },
      { type: 'recolor', color: 'aquamarine' },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });
  test('invalid message with illegal type but trying to do experimental custom rendering', async () => {
    const msg: any = [
      { type: 'p', children: [{ text: 'You might like this button!' }] },

      // invalid
      { type: 'mention', foo: 'bar' },

      // valid
      { type: 'kaarija', song: 'cha cha cha' },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(false);
  });

  test('valid message with mention inside link', async () => {
    const msg: any = [
      {
        type: 'p',
        children: [
          {
            type: 'link',
            url: 'https://example.com',
            children: [
              { text: 'Hey ' },
              {
                type: 'mention',
                user: { id: '58fab40b-3302-43aa-9c34-3b20ce61ba38' },
                children: [{ text: '@Oscar' }],
              },
              {
                text: " what's up",
              },
            ],
          },
        ],
      },
    ];
    let isValid = true;
    try {
      validateMessageContent(msg);
    } catch (e) {
      isValid = false;
    }
    expect(isValid).toBe(true);
  });
});
