import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional, userIdPositional } from 'src/positionalArgs';
import type { IdPositionalT, UserIdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';

async function listAllNotificationsHandler(argv: ListAllNotificationsOptionsT) {
  const options = [
    {
      field: 'filter',
      value: argv.filter,
    },
  ];
  const queryParams = buildQueryParams(options);
  const notifications = await fetchCordRESTApi(
    `users/${argv.userID}/notifications${queryParams}`,
  );
  prettyPrint(notifications);
}

const listAllNotificationsParameters = {
  filter: {
    description: 'Filter object as a json string',
    nargs: 1,
    string: true,
  },
} as const;

type ListAllNotificationsOptionsT = UserIdPositionalT &
  InferredOptionTypes<typeof listAllNotificationsParameters>;

async function createNotificationHandler(argv: CreateNotificationOptionsT) {
  const body = {
    type: argv.type,
    url: argv.url,
    template: argv.template,
    recipientID: argv.recipientID,
    actorID: argv.actorID,
    iconUrl: argv.iconUrl,
    extraClassnames: argv.extraClassnames,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
  };
  const result = await fetchCordRESTApi(
    'notifications',
    'POST',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const createNotificationOptions = {
  recipientID: {
    description: 'ID of the user receiving the notification',
    alias: 'recipientId',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  actorID: {
    description: 'ID of the user who is sending the notification',
    alias: 'actorId',
    nargs: 1,
    string: true,
  },
  template: {
    description: 'Template for the header of the notification',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  url: {
    description: 'Url of a page to go to when the notification is clicked',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  iconUrl: {
    description: 'Url of an icon image',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'Metadata of the notification as a json string',
    nargs: 1,
    string: true,
  },
  extraClassnames: {
    description:
      'A space separated list of classnames to add to the notification',
    nargs: 1,
    string: true,
  },
  type: {
    description: 'Currently must be set to "url"',
    nargs: 1,
    choices: ['url'],
    demandOption: true,
  },
} as const;
type CreateNotificationOptionsT = InferredOptionTypes<
  typeof createNotificationOptions
>;

async function deleteNotificationHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(`notifications/${argv.id}`, 'DELETE');
  prettyPrint(result);
}

export const notificationCommand = {
  command: 'notification',
  describe:
    'Manipulate notifications. For more info refer to docs: https://docs.cord.com/rest-apis/notifications',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls <userID>',
        'List all notifications a user has received: GET https://api.cord.com/v1/users/<USER_ID>/notifications',
        (yargs: Argv) =>
          yargs
            .positional('userID', userIdPositional.userID)
            .options(listAllNotificationsParameters),
        listAllNotificationsHandler,
      )
      .command(
        'create',
        'Create a notification: POST https://api.cord.com/v1/notifications',
        (yargs: Argv) => yargs.options(createNotificationOptions),
        createNotificationHandler,
      )
      .command(
        'delete <id>',
        'Delete a notification: DELETE https://api.cord.com/v1/notifications/<NOTIFICATION_ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteNotificationHandler,
      );
  },
  handler: (_: unknown) => {},
};
