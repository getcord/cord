import Ajv from 'ajv';
import type { MessageContent } from 'common/types/index.ts';
import { MAX_BULLET_INDENT } from '@cord-sdk/react/common/lib/messageNode.ts';

// This validator was written by attempting to validate 50k messages from our
// production DB. It's good at validating that a message is valid structurally.
// It's less good at preventing people from doing really wacky stuff like a
// million-character messages or whatever.
//
// The error messages from this are pretty lame, mostly because AJV is pretty
// minimal in its error messaging. If we wanted this message format to live a
// thousand years, I'd write this much more like a parser where we can stop at
// any point and give a meaningful error. Since we're very ambivalent about this
// message format, I'm just using AJV for now.
//
// It would be ideal to have this be part of the API types, but our auto-magic
// type-to-AJV stuff doesn't seem to handle everything that I can get out of
// manual AJV validation. If folks think this is absolutely silly of me,
// it's really not much work to convert this to something in our api-types library.
const TextSchema = {
  type: 'object',
  properties: {
    // You might expect this to have an enforced non-zero length, but
    // actually our own composer produces text nodes with empty string
    // values. It would be nasty of us to produce messages that we
    // wouldn't accept back directly.
    text: { type: 'string' },
    bold: { type: 'boolean' },
    italic: { type: 'boolean' },
    underline: { type: 'boolean' },
    code: { type: 'boolean' },
    class: { type: 'string' },
  },
  required: ['text'],
  additionalProperties: false,
};

// In the production DB if you go far enough back, there are messages
// that have the complete user object in the @-mention. Pretty sure
// we *don't* want that.
const MentionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^mention$' },
    class: { type: 'string' },
    user: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    children: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: {
        type: 'object',
        properties: {
          // these are names from our customers' users, which includes email addresses
          text: { type: 'string', pattern: '^@.+$' },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
  },
  required: ['type', 'user', 'children'],
  additionalProperties: false,
};

const TaskSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^assignee$' },
    user: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    children: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: {
        type: 'object',
        properties: {
          // these are names from our customers' users, which includes email addresses
          text: { type: 'string', pattern: '^[+].+$' },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
  },
  required: ['type', 'user', 'children'],
  additionalProperties: false,
};

const LinkSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^link$' },
    class: { type: 'string' },
    url: { type: 'string' }, // TODO: Swap this for a uri -- AJV was unhappy with me
    children: {
      type: 'array',
      items: { anyOf: [TextSchema, MentionSchema] },
    },
  },
  required: ['type', 'url', 'children'],
  additionalProperties: false,
};

const ParagraphSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^p$' },
    class: { type: 'string' },
    children: {
      type: 'array',
      items: { anyOf: [TextSchema, MentionSchema, TaskSchema, LinkSchema] },
      minItems: 1,
    },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

const BulletSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^bullet$' },
    class: { type: 'string' },
    children: {
      type: 'array',
      minItems: 1,
      items: { anyOf: [ParagraphSchema] },
    },
    indent: { type: 'integer', minimum: 0, maximum: MAX_BULLET_INDENT },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

const NumberBulletSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^number_bullet$' },
    class: { type: 'string' },
    children: {
      type: 'array',
      minItems: 1,
      items: { anyOf: [ParagraphSchema] },
    },
    bulletNumber: { type: 'integer' },
    indent: { type: 'integer', minimum: 0, maximum: MAX_BULLET_INDENT },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

const QuoteSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^quote$' },
    class: { type: 'string' },
    children: {
      type: 'array',
      items: {
        anyOf: [
          ParagraphSchema,
          BulletSchema,
          NumberBulletSchema,
          TextSchema,
          MentionSchema,
          TaskSchema,
          LinkSchema,
        ],
      },
      minItems: 1,
    },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

const CodeSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^code$' },
    class: { type: 'string' },
    children: {
      type: 'array',
      items: { anyOf: [TextSchema] },
      minItems: 1,
    },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

// I believe this is a dead format of message, actually? But we
// have them in the DB. There's actually an even older version of
// annotation where it's a free form JSON blob, but I pretty confident
// we *don't* want that.
const AnnotationSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^annotation$' },
    children: {
      type: 'array',
      items: { anyOf: [TextSchema] },
    },
    annotation: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  required: ['annotation', 'children'],
  additionalProperties: false,
};

// Danger Zone! Here's some wacky experimental stuff!
const ExperimentalCustomMessageSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      pattern:
        '^(?!p$|quote$|annotation$|code$|bullet$|number_bullet$|link$|mention$|assignee$|markdown$)[a-z]+$',
    },
  },
  additionalProperties: true,
  required: ['type'],
};

const MarkdownMessageSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', pattern: '^markdown$' },
    children: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: { type: 'object', properties: { text: { type: 'string' } } },
    },
  },
  required: ['type', 'children'],
  additionalProperties: false,
};

const MessageAJVSchema = {
  type: 'array',
  items: {
    anyOf: [
      ExperimentalCustomMessageSchema,
      ParagraphSchema,
      QuoteSchema,
      CodeSchema,
      TaskSchema,
      MentionSchema,
      BulletSchema,
      NumberBulletSchema,
      AnnotationSchema,
      LinkSchema,
      MarkdownMessageSchema,
    ],
  },
  minItems: 0, // Nodes have minimum children of 1, but an empty message is valid
};

const ajv = new Ajv.default({
  verbose: true,
});
const validateMessageContentAgainstSchema = ajv.compile(MessageAJVSchema);

export function validateMessageContent(
  msg: unknown,
): asserts msg is MessageContent {
  if (!validateMessageContentAgainstSchema(msg)) {
    throw new Error(
      'Message contents contained invalid element(s): ' +
        JSON.stringify(msg, null, 4),
    );
  }
}
