import type { ServerCreateMessage, ServerUpdateMessage } from '@cord-sdk/types';
import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';
import { markdownToNode } from 'src/messageFormatter/mdToNode';

const threadIdOption = {
  threadID: {
    description: 'ID of the thread',
    alias: 'threadId',
    nargs: 1,
    string: true,
    demandOption: true,
  },
} as const;

type ThreadIDOptionT = InferredOptionTypes<typeof threadIdOption>;

const optionalIdPositional = {
  id: {
    description: 'ID of the message',
    nargs: 1,
    string: true,
  },
} as const;

type OptionalIdPositionalT = InferredOptionTypes<typeof optionalIdPositional>;

async function listAllMessagesHandler(argv: ListAllMessageOptionsT) {
  const options = [
    {
      field: 'filter',
      value: argv.filter,
    },
    {
      field: 'token',
      value: argv.token,
    },
    {
      field: 'limit',
      value: argv.limit,
    },
  ];
  const queryParams = buildQueryParams(options);
  const messages = await fetchCordRESTApi(`messages${queryParams}`);
  prettyPrint(messages);
}

async function getMessageHandler(argv: ThreadIDOptionT & IdPositionalT) {
  const message = await fetchCordRESTApi(
    `threads/${argv.threadID}/messages/${argv.id}`,
  );
  prettyPrint(message);
}

async function createMessageHandler(
  argv: CreateMessageOptionsT & OptionalIdPositionalT,
) {
  const markdownContent = argv.markdownContent
    ? markdownToNode(argv.markdownContent)
    : undefined;
  const body: ServerCreateMessage = {
    id: argv.id,
    url: argv.url,
    type: argv.type,
    authorID: argv.authorID,
    extraClassnames: argv.extraClassnames,
    iconURL: argv.iconUrl,
    translationKey: argv.translationKey,
    content: argv.content ? JSON.parse(argv.content) : markdownContent,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    addReactions: argv.addReactions ? JSON.parse(argv.addReactions) : undefined,
    addAttachments: argv.addAttachments
      ? JSON.parse(argv.addAttachments)
      : undefined,
    createThread: argv.createThread ? JSON.parse(argv.createThread) : undefined,
    createdTimestamp: argv.createdTimestamp
      ? new Date(argv.createdTimestamp)
      : undefined,
    deletedTimestamp: argv.deletedTimestamp
      ? new Date(argv.deletedTimestamp)
      : undefined,
    updatedTimestamp: argv.updatedTimestamp
      ? new Date(argv.updatedTimestamp)
      : undefined,
    skipLinkPreviews: argv.skipLinkPreviews,
  };

  const result = await fetchCordRESTApi(
    `threads/${argv.threadID}/messages`,
    'POST',
    JSON.stringify(body),
  );

  prettyPrint(result);
}

async function updateMessageHandler(argv: UpdateMessageOptionsT) {
  const markdownContent = argv.markdownContent
    ? markdownToNode(argv.markdownContent)
    : undefined;
  const body: ServerUpdateMessage = {
    url: argv.url,
    type: argv.type,
    id: argv.newID,
    authorID: argv.authorID,
    extraClassnames: argv.extraClassnames,
    iconURL: argv.iconUrl,
    translationKey: argv.translationKey,
    content: argv.content ? JSON.parse(argv.content) : markdownContent,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    addReactions: argv.addReactions ? JSON.parse(argv.addReactions) : undefined,
    addAttachments: argv.addAttachments
      ? JSON.parse(argv.addAttachments)
      : undefined,
    createdTimestamp: argv.createdTimestamp
      ? new Date(argv.createdTimestamp)
      : undefined,
    deletedTimestamp: argv.deletedTimestamp
      ? new Date(argv.deletedTimestamp)
      : undefined,
    updatedTimestamp: argv.updatedTimestamp
      ? new Date(argv.updatedTimestamp)
      : undefined,
    skipLinkPreviews: argv.skipLinkPreviews,
  };
  const result = await fetchCordRESTApi(
    `threads/${argv.threadID}/messages/${argv.id}`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function deleteMessageHandler(argv: IdPositionalT & ThreadIDOptionT) {
  const result = await fetchCordRESTApi(
    `threads/${argv.threadID}/messages/${argv.id}`,
    'DELETE',
  );
  prettyPrint(result);
}

const listAllMessagesParameters = {
  limit: {
    description: 'Max number of messages to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'Pagination token',
    nargs: 1,
    string: true,
  },
  filter: {
    description: 'Partial match filter object as a json string',
    nargs: 1,
    string: true,
  },
} as const;

type ListAllMessageOptionsT = InferredOptionTypes<
  typeof listAllMessagesParameters
>;

const createOrUpdateBaseMessageOptions = {
  addReactions: {
    description: 'Reactions to add to this message as a json string',
    nargs: 1,
    string: true,
  },
  addAttachments: {
    description: 'Attachments to add to this message as a json string',
    nargs: 1,
    string: true,
  },
  authorID: {
    description: 'ID of the user who sent the message',
    alias: 'authorId',
    nargs: 1,
    string: true,
  },
  content: {
    description: 'Content of the message as a json string',
    nargs: 1,
    string: true,
  },
  markdownContent: {
    description:
      'Content of the message as a markdown string. This currently cannot format mentions.',
    nargs: 1,
    string: true,
  },
  iconUrl: {
    description: 'Url of the icon to show next to an action message',
    nargs: 1,
    string: true,
  },
  translationKey: {
    description: 'Translation key to use for this message',
    nargs: 1,
    string: true,
  },
  createdTimestamp: {
    description: 'Timestamp the message was created',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'Metadata of the thread as a json string',
    nargs: 1,
    string: true,
  },
  url: {
    description: 'A url where the message can be seen',
    nargs: 1,
    string: true,
  },
  deletedTimestamp: {
    description: 'Timestamp when the message was deleted',
    nargs: 1,
    string: true,
  },
  updatedTimestamp: {
    description: 'Timestamp when the message was updated',
    nargs: 1,
    string: true,
  },
  skipLinkPreviews: {
    description: 'Whether to skip url link unfurling',
    nargs: 1,
    boolean: true,
  },
  type: {
    description: 'Type of message',
    nargs: 1,
    choices: ['action_message', 'user_message'],
  },
  extraClassnames: {
    description: 'A space separated list of classnames to add to the thread',
    nargs: 1,
    string: true,
  },
} as const;

const createMessageOptions = {
  ...createOrUpdateBaseMessageOptions,
  createThread: {
    description:
      "Parameters for creating a thread, if the thread doesn't exist yet, as a json string",
    nargs: 1,
    string: true,
  },
  authorID: {
    ...createOrUpdateBaseMessageOptions.authorID,
    demandOption: true,
  },
} as const;

const updateMessageOptions = {
  ...createOrUpdateBaseMessageOptions,
  newID: {
    description: 'Remove existing message id and replace with this new one',
    alias: 'newId',
    nargs: 1,
    string: true,
  },
} as const;

type CreateMessageOptionsT = ThreadIDOptionT &
  InferredOptionTypes<typeof createMessageOptions>;
type UpdateMessageOptionsT = ThreadIDOptionT &
  IdPositionalT &
  InferredOptionTypes<typeof updateMessageOptions>;

export const messageCommand = {
  command: 'message',
  description:
    'Manipulate messages. For more info refer to docs: https://docs.cord.com/rest-apis/messages',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all messages: GET https://api.cord.com/v1/messages',
        (yargs: Argv) => yargs.options(listAllMessagesParameters),
        listAllMessagesHandler,
      )
      .command(
        'get <id>',
        'Get a message: GET https://api.cord.com/v1/threads/<threadID>/messages/<messageID>',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(threadIdOption),
        getMessageHandler,
      )
      .command(
        'create [id]',
        'Add a new message to a thread: POST https://api.cord.com/v1/threads/<ID>/messages',
        (yargs: Argv) =>
          yargs
            .options({ ...createMessageOptions, ...threadIdOption })
            .options(threadIdOption)
            .positional('id', optionalIdPositional.id)
            .check((argv) => {
              if (argv.content || argv.markdownContent) {
                return true;
              }
              throw new Error(
                'You need to provide either content or markdownContent',
              );
            }),
        createMessageHandler,
      )
      .command(
        'update <id>',
        'Update a message: PUT https://api.cord.com/v1/threads/<threadID>/messages/<messageID>',
        (yargs: Argv) =>
          yargs
            .options({ ...updateMessageOptions, ...threadIdOption })
            .positional('id', idPositional.id),
        updateMessageHandler,
      )
      .command(
        'delete <id>',
        'Delete a message: DELETE https://api.cord.com/v1/threads/<threadID>/messages/<messageID>',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(threadIdOption),
        deleteMessageHandler,
      );
  },
  handler: (_: unknown) => {},
};
