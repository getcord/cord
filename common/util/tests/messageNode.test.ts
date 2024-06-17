import { v4 as uuid } from 'uuid';
import type { MessageContent } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import {
  convertStructuredMessageToText,
  taskTitleFromMessageContent,
} from '@cord-sdk/react/common/lib/messageNode.ts';

const messageWithParagraph: MessageContent = [
  {
    type: MessageNodeType.PARAGRAPH,
    children: [{ text: 'this is a task' }],
  },
];

const messageWithParagraphAndAssignee: MessageContent = [
  {
    type: MessageNodeType.PARAGRAPH,
    children: [
      { text: 'change this button ' },
      {
        type: MessageNodeType.ASSIGNEE,
        user: { id: uuid() },
        children: [{ text: '+Andrei' }],
      },
      { text: ' ' },
    ],
  },
];

const messageWithParagraphAndTODOs: MessageContent = [
  {
    type: MessageNodeType.PARAGRAPH,
    children: [
      { text: '' },
      {
        type: MessageNodeType.ASSIGNEE,
        user: { id: uuid() },
        children: [{ text: '+Andrei' }],
      },
      { text: ' do these things:' },
    ],
  },
  {
    done: false,
    type: MessageNodeType.TODO,
    todoID: uuid(),
    children: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'reticulate splines' }],
      },
    ],
  },
  {
    done: false,
    type: MessageNodeType.TODO,
    todoID: uuid(),
    children: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'rip and tear' }],
      },
    ],
  },
  {
    done: false,
    type: MessageNodeType.TODO,
    todoID: uuid(),
    children: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'find the exit' }],
      },
    ],
  },
];

const messageWithOnlyTODOs: MessageContent = [
  {
    done: false,
    type: MessageNodeType.TODO,
    todoID: uuid(),
    children: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'foo' }],
      },
    ],
  },
  {
    done: false,
    type: MessageNodeType.TODO,
    todoID: uuid(),
    children: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [{ text: 'bar' }],
      },
    ],
  },
];

const messageWithLeadingAndTrailingAssignees: MessageContent = [
  {
    type: MessageNodeType.PARAGRAPH,
    children: [
      {
        text: '',
      },
      {
        type: MessageNodeType.ASSIGNEE,
        user: {
          id: '960f63ab-6c0e-4d2c-a505-9095dcc60fff',
        },
        children: [
          {
            text: '+jozef',
          },
        ],
      },
      {
        text: ' test ',
      },
      {
        type: MessageNodeType.ASSIGNEE,
        user: {
          id: '7a30fb39-1130-4621-a3b1-d21f58ba7c97',
        },
        children: [
          {
            text: '+andrei_saturn',
          },
        ],
      },
      {
        text: ' ',
      },
    ],
  },
];

const messageWithAssigneeInTheMiddle: MessageContent = [
  {
    type: MessageNodeType.PARAGRAPH,
    children: [
      {
        text: '',
      },
      {
        type: MessageNodeType.ASSIGNEE,
        user: {
          id: '960f63ab-6c0e-4d2c-a505-9095dcc60fff',
        },
        children: [
          {
            text: '+jozef',
          },
        ],
      },
      {
        text: ' some text ',
      },
      {
        type: MessageNodeType.ASSIGNEE,
        user: {
          id: '2b908e57-9e44-4026-9b6c-91f19b0f1858',
        },
        children: [
          {
            text: '+terrence',
          },
        ],
      },
      {
        text: ' more text ',
      },
      {
        type: MessageNodeType.ASSIGNEE,
        user: {
          id: 'c2101554-2ae9-4c86-8e22-894c9e2b6728',
        },
        children: [
          {
            text: '+myhoa',
          },
        ],
      },
      {
        text: ' ',
      },
    ],
  },
];

test('message with simple paragraph', () => {
  expect(taskTitleFromMessageContent(messageWithParagraph)).toBe(
    'this is a task',
  );
});

test('message with paragraph and assignee', () => {
  expect(taskTitleFromMessageContent(messageWithParagraphAndAssignee)).toBe(
    'change this button',
  );
});

test('message with paragraph and TODOs', () => {
  expect(taskTitleFromMessageContent(messageWithParagraphAndTODOs)).toBe(
    'do these things',
  );
});

test('message with only TODOs', () => {
  expect(taskTitleFromMessageContent(messageWithOnlyTODOs)).toBe('foo');
});

test('message with leading and trailing assignees', () => {
  expect(
    taskTitleFromMessageContent(messageWithLeadingAndTrailingAssignees),
  ).toBe('test');
});

test('message with leading, middle and trailing assignees', () => {
  expect(taskTitleFromMessageContent(messageWithAssigneeInTheMiddle)).toBe(
    'some text terrence more text',
  );
});

test('convertStructuredMessageToText', () => {
  expect(convertStructuredMessageToText(messageWithParagraphAndAssignee)).toBe(
    'change this button +Andrei',
  );
});
