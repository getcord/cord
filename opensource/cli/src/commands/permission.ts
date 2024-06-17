import type { Argv, InferredOptionTypes } from 'yargs';

import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { prettyPrint } from 'src/prettyPrint';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';

async function createPermissionHandler(argv: CreatePermissionOptionsT) {
  const create = {
    resourceFilter: {
      id: argv.resourceId,
      metadata: argv.resourceMetadata
        ? JSON.parse(argv.resourceMetadata)
        : undefined,
    },
    userFilter: {
      id: argv.userID,
      metadata: argv.userMetadata ? JSON.parse(argv.userMetadata) : undefined,
    },
    permission: argv.permission,
  };
  const result = await fetchCordRESTApi(
    'experimental/permissions',
    'POST',
    JSON.stringify(create),
  );
  prettyPrint(result);
}

async function deletePermissionHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(
    `experimental/permissions/${argv.id}`,
    'DELETE',
  );
  prettyPrint(result);
}

const createPermissionOptions = {
  resourceId: {
    string: true,
    array: true,
  },
  resourceMetadata: {
    string: true,
  },
  userID: {
    alias: 'userId',
    string: true,
    array: true,
  },
  userMetadata: {
    string: true,
  },
  permission: {
    string: true,
    array: true,
    required: true,
  },
} as const;

type CreatePermissionOptionsT = InferredOptionTypes<
  typeof createPermissionOptions
>;

export const permissionCommand = {
  command: ['permission'],
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'create',
        'create a permission',
        (yargs: Argv) => yargs.options(createPermissionOptions),
        createPermissionHandler,
      )
      .command(
        'delete <id>',
        'delete a permission',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deletePermissionHandler,
      );
  },
  handler: (_: unknown) => {},
};
