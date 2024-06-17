import FormData from 'form-data';
import { unique } from 'radash';

import type { Logger } from 'server/src/logging/Logger.ts';
import { MONDAY_AUTH_REDIRECT_URL } from 'common/util/oauth.ts';
import env from 'server/src/config/Env.ts';
import type {
  JsonValue,
  MondayBoard,
  MondayItemPreviewData,
} from 'common/types/index.ts';
import { thirdPartyGraphQLRequest } from 'server/src/third_party_tasks/util.ts';

type UserInfoQueryResult = {
  me: {
    id: number;
    email: string;
  };
  boards: Array<{
    id: string;
    subitem_board?: {
      id: string;
    };
  }>;
};

export async function completeOAuthFlow(
  code: string,
): Promise<[string, UserInfoQueryResult]> {
  const params = new URLSearchParams();
  params.append('client_id', env.MONDAY_APP_CLIENT_ID);
  params.append('client_secret', env.MONDAY_APP_CLIENT_SECRET);
  params.append('redirect_uri', MONDAY_AUTH_REDIRECT_URL);
  params.append('code', code);
  const response = await fetch('https://auth.monday.com/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const { access_token } = await response.json();

  const userInfo = await getUserInfo(access_token);
  if (!userInfo) {
    throw new Error('Could not fetch Monday user information.');
  }

  return [access_token, userInfo];
}

async function apiRequest<T extends JsonValue = JsonValue>(
  query: string,
  accessToken: string,
  variables: object | null = null,
): Promise<T> {
  return await thirdPartyGraphQLRequest(
    'monday',
    query,
    accessToken,
    variables,
  );
}

async function getUserInfo(
  accessToken: string,
): Promise<UserInfoQueryResult | null> {
  const query = `
    query UserInfo {
      me {
        id
        email
      }
      boards {
        id
        subitem_board {
          id
        }
      }
    }`;

  return await apiRequest<UserInfoQueryResult>(query, accessToken);
}

export async function getBoards(accessToken: string): Promise<MondayBoard[]> {
  const query = `
  query Boards {
    boards {
      id
      name
      subitem_board {
        id
      }
      groups {
        id
        title
        position
      }
    }
  }`;

  const responseJson = await apiRequest<{ boards: MondayBoard[] }>(
    query,
    accessToken,
  );

  // Monday handles subitems by making them items on a different, hidden board
  // from the board the parent item is on.  It doesn't make sense to let users
  // add items directly to those boards, so filter them out.
  return removeSubitemBoards(responseJson.boards);
}

export function removeSubitemBoards<
  T extends UserInfoQueryResult['boards'][number],
>(boards: T[] | null | undefined): T[] {
  return boards
    ? boards.filter(
        (board) =>
          !boards.some(
            (otherBoard) => board.id === otherBoard.subitem_board?.id,
          ),
      )
    : [];
}

export async function createUpdate(
  accessToken: string,
  itemID: string,
  text: string,
) {
  const query = `
    mutation CreateUpdate($itemID: Int!, $text: String!) {
      create_update(item_id: $itemID, body: $text) {
        id
      }
    }`;
  await apiRequest(query, accessToken, {
    itemID: parseInt(itemID, 10),
    text,
  });
}

export async function createItem(
  accessToken: string,
  boardID: string,
  groupID: string | undefined,
  title: string,
  update: string,
) {
  const mutation = `
    mutation CreateItem($boardID: Int!, $groupID: String, $title: String!) {
      create_item(board_id: $boardID, group_id: $groupID, item_name: $title) {
        id
      }
    }`;
  const responseJson = await apiRequest<{ create_item?: { id?: string } }>(
    mutation,
    accessToken,
    {
      boardID: parseInt(boardID, 10),
      groupID,
      title,
    },
  );
  const itemID = responseJson?.create_item?.id;
  if (!itemID) {
    throw new Error("Didn't receive an ID back from Monday");
  }
  await createUpdate(accessToken, itemID, update);
  return itemID;
}

export async function createSubItem(
  accessToken: string,
  parentItemID: string,
  title: string,
  update: string,
) {
  const mutation = `
    mutation CreateSubItem($parentItemID: Int!, $title: String!) {
      create_subitem(parent_item_id: $parentItemID, item_name: $title) {
        id
      }
    }`;
  const responseJson = await apiRequest<{ create_subitem?: { id?: string } }>(
    mutation,
    accessToken,
    {
      parentItemID: parseInt(parentItemID, 10),
      title,
    },
  );
  const subItemID = responseJson?.create_subitem?.id;
  if (!subItemID) {
    throw new Error("Didn't receive an ID back from Monday");
  }
  await createUpdate(accessToken, subItemID, update);
  return subItemID;
}

type SubItemCheckResponse = {
  items: Array<{
    board: {
      columns: Array<{
        type: string;
      }>;
    };
  }>;
};

export async function canCreateSubItems(
  accessToken: string,
  itemID: string,
): Promise<boolean> {
  const query = `
    query SubItemCheck($itemID: Int!) {
      items(ids: [$itemID]) {
        board {
          columns {
            type
          }
        }
      }
    }`;
  const responseJson = await apiRequest<SubItemCheckResponse>(
    query,
    accessToken,
    {
      itemID: parseInt(itemID, 10),
    },
  );
  return !!responseJson.items[0].board.columns.some(
    (c) => c.type === 'subtasks',
  );
}

type PreviewDataResponse = {
  me: {
    account: {
      slug: string;
    };
  };
  items: Array<{
    name: string;
    board: {
      id: string;
      columns: Array<ColumnData>;
    };
    column_values: Array<{
      id: string;
      type: string;
      value: string | null;
    }>;
  }>;
};

export async function getMondayPreviewData(
  accessToken: string,
  itemID: string,
): Promise<MondayItemPreviewData> {
  const query = `
    query PreviewData($itemID: Int!) {
      me {
        account {
          slug
        }
      }
      items(ids: [$itemID]) {
        name
        board {
          id
          columns {
            id
            type
            settings_str
          }
        }
        column_values {
          id
          type
          value
        }
      }
    }
  `;
  const responseJson = await apiRequest<PreviewDataResponse>(
    query,
    accessToken,
    { itemID: parseInt(itemID, 10) },
  );
  const item = responseJson.items[0];
  const assigneeColumn = item.column_values.find(
    (c) => c.type === 'multiple-person',
  );
  const assigneeIDs: string[] = assigneeColumn?.value
    ? // Monday can have the same person assigned multiple times (?!), so
      // uniqify the list of assignees
      unique(
        JSON.parse(assigneeColumn.value)?.personsAndTeams?.map(
          (p: { id: string }) => p.id,
        ) ?? [],
      )
    : [];
  // Mirror the behavior for Cord tasks: when assigned to 1 person, show their
  // name; when assigned to 2+ people, show "N people"
  let assignee = undefined;
  if (assigneeIDs.length === 1) {
    const userQuery = `
      query UserQuery($userID: Int!) {
        users(ids: [$userID]) {
          name
        }
      }`;
    const userResponseJson = await apiRequest<{
      users: Array<{ name: string }>;
    }>(userQuery, accessToken, { userID: parseInt(assigneeIDs[0], 10) });
    assignee = userResponseJson.users[0]?.name;
  } else if (assigneeIDs.length > 0) {
    assignee = `${assigneeIDs.length} people`;
  }
  const doneColumn = findDoneColumn(item.board.columns);
  let done = false;
  if (doneColumn) {
    const doneColumnValue = item.column_values.find(
      (cv) => cv.id === doneColumn.id,
    );
    if (doneColumnValue?.value) {
      const index = JSON.parse(doneColumnValue.value).index;
      done = doneColumn.doneValues.includes(index);
    }
  }
  return {
    title: item.name,
    url: `https://${responseJson.me.account.slug}.monday.com/boards/${item.board.id}/pulses/${itemID}`,
    assignee,
    done,
    assigneeColumnID: assigneeColumn?.id,
    statusColumnID: doneColumn?.id,
  };
}

type AssigneeDataResponse = {
  items: Array<{
    board: {
      id: string;
    };
    column_values: Array<{
      id: string;
      type: string;
      value: string | null;
    }>;
  }>;
};

type PersonColumnValue = {
  personsAndTeams: Array<{
    id: number;
    kind: 'person' | 'team';
  }>;
};

export async function addAssignees(
  accessToken: string,
  itemID: string,
  assignees: string[],
  logger: Logger,
) {
  const query = `
    query AssigneeData($itemID: Int!) {
      items(ids: [$itemID]) {
        board {
          id
        }
        column_values {
          id
          type
          value
        }
      }
    }`;
  const responseJson = await apiRequest<AssigneeDataResponse>(
    query,
    accessToken,
    { itemID: parseInt(itemID, 10) },
  );
  const item = responseJson.items[0];
  const firstPersonColumn = item.column_values.find(
    (c) => c.type === 'multiple-person',
  );
  if (!firstPersonColumn) {
    // Nobody can be assigned, which is a bummer
    logger.error('No person column found when trying to assign a Monday task', {
      boardID: item.board.id,
      itemID,
    });
    return;
  }
  const columnValue = JSON.parse(
    firstPersonColumn.value ?? '{"personsAndTeams": []}',
  ) as PersonColumnValue;

  const existingIDs = columnValue.personsAndTeams.map((p) => p.id.toString());

  columnValue.personsAndTeams.push(
    ...assignees
      .filter((a) => !existingIDs.includes(a))
      .map((a) => ({ id: parseInt(a, 10), kind: 'person' as const })),
  );
  const mutation = `
    mutation AssignItem($boardID: Int!, $itemID: Int!, $columnID: String!, $assignees: JSON!) {
      change_column_value(board_id: $boardID, item_id: $itemID, column_id: $columnID, value: $assignees) {
        id
      }
    }`;
  await apiRequest(mutation, accessToken, {
    itemID: parseInt(itemID, 10),
    boardID: parseInt(item.board.id, 10),
    columnID: firstPersonColumn.id,
    assignees: JSON.stringify(columnValue),
  });
}

type ColumnDataResponse = {
  items: Array<{
    board: {
      id: string;
      columns: Array<ColumnData>;
    };
  }>;
};

type ColumnData = {
  id: string;
  type: string;
  settings_str: string;
};

type ColorColumnSettings = {
  done_colors?: number[];
  labels: Record<number, string>;
};

const MONDAY_TASK_NOT_DONE_STATUS = 5;
const MONDAY_DEFAULT_DONE_COLORS = [1];

export async function setItemStatus(
  accessToken: string,
  itemID: string,
  done: boolean,
  logger: Logger,
) {
  const query = `
    query ColumnData($itemID: Int!) {
      items(ids: [$itemID]) {
        board {
          id
          columns {
            id
            type
            settings_str
          }
        }
      }
    }`;
  const columnData = await apiRequest<ColumnDataResponse>(query, accessToken, {
    itemID: parseInt(itemID, 10),
  });
  const item = columnData.items[0];
  const doneColumn = findDoneColumn(item.board.columns);
  if (!doneColumn) {
    // These tasks don't have status, so we can't set it
    logger.error(
      'No status column found when trying to change status of a Monday task',
      {
        boardID: item.board.id,
        itemID,
      },
    );
    return;
  }
  // The color column settings only update when the user changes something, and
  // only update the minimal amount, which means you need to infer some things.
  // Relevant to us for figuring out the "done" status:
  // * Each new status has an index set when it's created and it never changes
  // * The done_colors field holds which indexes mean "done"
  // * Columns start with 3 statues, with index 1 meaning "done", and if there's
  //   no done_colors then index 1 is still the only "done" status
  // * done_colors isn't updated when statuses are deleted, so we need to check
  //   to make sure what we want is still there
  // * Index 5 (which never appears in the data) is always a gray status with no
  //   label that's not done; users aren't allowed to change its color or remove
  //   it
  const statusToSet = !done
    ? MONDAY_TASK_NOT_DONE_STATUS
    : doneColumn.doneValues[0];
  if (!statusToSet) {
    // This column doesn't have any done statuses, so we can't set it
    logger.error(
      'No done status found when trying to change status of a Monday task',
      {
        boardID: item.board.id,
        itemID,
      },
    );
    return;
  }
  const mutation = `
    mutation UpdateStatus($boardID: Int!, $itemID: Int!, $columnID: String!, $status: String!) {
      change_simple_column_value(board_id: $boardID, item_id: $itemID, column_id: $columnID, value: $status) {
        id
      }
    }`;
  await apiRequest(mutation, accessToken, {
    boardID: parseInt(item.board.id, 10),
    itemID: parseInt(itemID, 10),
    columnID: doneColumn.id,
    status: statusToSet.toString(),
  });
}

type DoneColumnInfo = {
  id: string;
  doneValues: number[];
};

function findDoneColumn(columns: ColumnData[]): DoneColumnInfo | null {
  // Monday tasks can have multiple "status" columns, we arbitrarily pick the
  // first one
  const firstStatusColumn = columns.find((c) => c.type === 'color');
  if (!firstStatusColumn) {
    return null;
  }
  // The color column settings only update when the user changes something, and
  // only update the minimal amount, which means you need to infer some things.
  // Relevant to us for figuring out the "done" status:
  // * Each new status has an index set when it's created and it never changes
  // * The done_colors field holds which indexes mean "done"
  // * Columns start with 3 statues, with index 1 meaning "done", and if there's
  //   no done_colors then index 1 is still the only "done" status
  // * done_colors isn't updated when statuses are deleted, so we need to check
  //   to make sure what we want is still there
  // * Index 5 (which never appears in the data) is always a gray status with no
  //   label that's not done; users aren't allowed to change its color or remove
  //   it
  const settings = JSON.parse(
    firstStatusColumn.settings_str,
  ) as ColorColumnSettings;
  if (!settings.done_colors) {
    settings.done_colors = MONDAY_DEFAULT_DONE_COLORS;
  }
  return {
    id: firstStatusColumn.id,
    doneValues: settings.done_colors.filter((c) => c in settings.labels),
  };
}

type OldestUpdateResponse = {
  items: Array<{
    updates: Array<{
      id: string;
      created_at: string;
    }>;
  }>;
};

export async function findOldestUpdate(
  accessToken: string,
  itemID: string,
): Promise<string | null> {
  const query = `
    query OldestMutation($itemID: Int!) {
      items(ids: [$itemID]) {
        updates {
          id
          created_at
        }
      }
    }`;
  const responseJson = await apiRequest<OldestUpdateResponse>(
    query,
    accessToken,
    {
      itemID: parseInt(itemID, 10),
    },
  );
  const updates = responseJson.items[0].updates;
  updates.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return updates[0]?.id ?? null;
}

export async function uploadFile(
  accessToken: string,
  updateID: string,
  filename: string,
  contentType: string,
  filesize: number,
  stream: ReadableStream<Uint8Array>,
) {
  // Monday has a special API endpoint for file uploads that accepts files
  // as multipart form data
  const mutation = `
    mutation add_file($updateID: Int!, $file: File!) {
      add_file_to_update(update_id: $updateID, file: $file) {
        id
      }
    }`;
  const form = new FormData();
  form.append('query', mutation, { contentType: 'application/json' });
  form.append(
    'variables',
    JSON.stringify({ updateID: parseInt(updateID, 10) }),
    { contentType: 'application/json' },
  );
  // This says the query variable "file" is found in the multipart section named
  // "attachment"
  form.append('map', JSON.stringify({ attachment: 'variables.file' }), {
    contentType: 'application/json',
  });
  form.append('attachment', stream, {
    filename,
    contentType,
    knownLength: filesize,
  });

  return await fetch('https://api.monday.com/v2/file', {
    method: 'POST',
    headers: {
      Authorization: accessToken,
    },
    body: form.getBuffer(),
  });
}

export async function createWebhook(
  accessToken: string,
  boardID: string,
  url: string,
) {
  const mutation = `
    mutation CreateWebhook($boardID: Int!, $url: String!) {
      create_webhook(board_id:$boardID, url:$url, event:change_column_value) {
        id
      }
    }`;
  const responseJson = await apiRequest<{ create_webhook?: { id: string } }>(
    mutation,
    accessToken,
    {
      boardID: parseInt(boardID, 10),
      url,
    },
  );
  return responseJson?.create_webhook?.id ?? null;
}
