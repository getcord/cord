import cx from 'classnames';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { TableCell, TableRow, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

import type { JsonObject, UUID } from 'common/types/index.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import type { CoreMessageData, ServerListMessages } from '@cord-sdk/types';
import { DeletionConfirmationModal } from 'external/src/entrypoints/console/components/DeletionConfirmationModal.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { EmptyState } from 'external/src/entrypoints/console/components/EmptyState.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { TimestampCell } from 'external/src/entrypoints/console/components/TimestampCell.tsx';
import { JSONCell } from 'external/src/entrypoints/console/components/JSONCell.tsx';
import type {
  GetDataResponse,
  RenderRowParams,
} from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { ConsoleDataTableWithPagination } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { MoreCell } from 'external/src/entrypoints/console/components/MoreCell.tsx';
import { useGetApplicationUser } from 'external/src/entrypoints/console/hooks/useGetApplicationUser.tsx';
import { useGetApplicationOrg } from 'external/src/entrypoints/console/hooks/useGetApplicationOrg.tsx';

const LIMIT_MESSAGES = 35;
const HEADERS = [
  'Message ID',
  'Group',
  'Thread ID',
  'Author',
  'URL',
  'Content',
  'Plaintext',
  'Created',
  'Updated',
  'Deleted',
  'Type',
  'Extra classnames',
  'Attachments',
  'Reactions',
  'Metadata',
  '', // "More" column
];

const useStyles = createUseStyles({
  noWrap: { textWrap: 'nowrap' },
  plaintextCell: {
    textOverflow: 'ellipsis',
    maxWidth: 200,
    overflow: 'hidden',
  },
  apiInformationBlock: { marginBlockEnd: Sizes.XLARGE },
});

// This is needed because we specify the type of some timestamps as Date
// but in reality we are given a string back from the REST API
// So we remove them from the return type and add them back as strings
// Doing this as a temporary thing to unblock myself but we should look
// at how we might want to fix this
type MessageData = Omit<
  CoreMessageData,
  | 'createdTimestamp'
  | 'updatedTimestamp'
  | 'deletedTimestamp'
  | 'content'
  | 'attachments'
  | 'reactions'
> & {
  createdTimestamp: string;
  updatedTimestamp: string;
  deletedTimestamp: string;
  content: JsonObject[];
  // Also replacing the type on attachments because for some reason TS doesn't
  // believe Attachment[] matches JsonObject[], and I don't want to figure out
  // why
  attachments: JsonObject[];
  // Deferring from solving this correctly
  reactions: JsonObject[];
};

export function ApplicationMessages() {
  const classes = useStyles();

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );
  const { threadID } = useUnsafeParams<{ id: UUID; threadID?: string }>();
  const [queryUrl, setQueryUrl] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<{
    id: string;
    threadID: string;
    refetch: () => Promise<void>;
  } | null>(null);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);

  const listAllMessages = !threadID;

  useEffect(() => {
    setQueryUrl(
      listAllMessages
        ? `${API_ORIGIN}/v1/messages?limit=10`
        : `${API_ORIGIN}/v1/threads/${threadID}/messages`,
    );
  }, [listAllMessages, threadID]);

  const deleteMessage = useCallback(
    async (
      message: {
        id: string;
        threadID: string;
        refetch: () => Promise<void>;
      } | null,
    ) => {
      if (!application || !message) {
        return;
      }

      const { id, threadID: messageThreadID } = message;

      const response = await fetch(
        `${API_ORIGIN}/v1/threads/${messageThreadID}/messages/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
        },
      );

      if (response.status === 200) {
        await selectedMessage?.refetch();
      }
    },
    [application, selectedMessage],
  );

  const hideDeletionModal = useCallback(() => {
    setDeletionModalVisible(false);
    setSelectedMessage(null);
  }, []);

  const showDeletionModal = useCallback(
    (
      messageID: string,
      messageThreadID: string,
      refetch: () => Promise<void>,
    ) => {
      setDeletionModalVisible(true);
      setSelectedMessage({
        id: messageID,
        threadID: messageThreadID,
        refetch,
      });
    },
    [],
  );

  const confirmDeletion = useCallback(async () => {
    setDeletionModalVisible(false);
    await deleteMessage(selectedMessage);
  }, [selectedMessage, deleteMessage]);

  const fetchMessage = useCallback(
    async (token: string | null): Promise<GetDataResponse<CoreMessageData>> => {
      const appendToken = token ? `&token=${token}` : '';

      const url = listAllMessages
        ? `${API_ORIGIN}/v1/messages?limit=${LIMIT_MESSAGES}${appendToken}`
        : `${API_ORIGIN}/v1/threads/${threadID}/messages`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application!.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      const res = await response.json();

      if (listAllMessages) {
        const resAllMessages = res as ServerListMessages;
        setMessageCount(resAllMessages.pagination.total);
        return {
          data: resAllMessages.messages,
          totalItems: resAllMessages.pagination.total,
          token: resAllMessages.pagination.token,
        };
      } else {
        // The thread messages endpoint doesn't have pagination yet
        setMessageCount(res.length);
        return {
          data: res,
          totalItems: res.length,
          token: null,
        };
      }
    },
    [application, listAllMessages, threadID],
  );

  const queryKey = useMemo(
    () => [
      'console-messages',
      `application-${application?.id}`,
      `thread-${threadID}`,
    ],
    [application?.id, threadID],
  );

  if (!application) {
    return <SpinnerCover />;
  }

  return (
    <Main header={<Header text="Messages" />}>
      <Helmet>
        <title>Messages</title>
      </Helmet>
      <>
        <ApiInformationBlock
          url={queryUrl}
          docsLink="/rest-apis/messages"
          cliCommand="cord message"
          className={classes.apiInformationBlock}
        />
        {messageCount && messageCount > 0 ? (
          <Typography variant="body1">
            <strong>
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </strong>{' '}
            {threadID ? `in thread: ${threadID}` : undefined}
          </Typography>
        ) : undefined}
        {messageCount === null || messageCount > 0 ? (
          <div>
            <ConsoleDataTableWithPagination
              queryKey={queryKey}
              headers={HEADERS}
              getData={fetchMessage}
              renderRow={(props) => (
                <Row
                  {...props}
                  onDeletionClicked={showDeletionModal}
                  key={props.row.id}
                />
              )}
            />
          </div>
        ) : undefined}
        <DeletionConfirmationModal
          header="Delete message?"
          body={
            <>
              <p>
                Deleting a message will delete the message{' '}
                <strong>permanently</strong> . This can not be undone. Press
                Delete to confirm or Cancel to back out.
              </p>
            </>
          }
          visible={deletionModalVisible}
          onCancel={hideDeletionModal}
          onDelete={() => void confirmDeletion()}
        />
      </>
      {messageCount === 0 ? (
        <EmptyState
          path={'messages'}
          location={threadID ? `thread: ${threadID}` : undefined}
          threadID={threadID}
        />
      ) : undefined}
    </Main>
  );
}

function Row({
  row: rowUntyped,
  refetch,
  onDeletionClicked,
}: RenderRowParams<CoreMessageData> & {
  onDeletionClicked: (
    messageID: string,
    threadID: string,
    refetch: () => Promise<void>,
  ) => void;
}) {
  const classes = useStyles();

  const row = rowUntyped as unknown as MessageData;
  const moreOptions = [
    {
      text: 'Delete',
      callback: () => {
        onDeletionClicked(row.id, row.threadID, refetch);
      },
    },
  ];
  const user = useGetApplicationUser(row.authorID);
  const { org } = useGetApplicationOrg(row.organizationID);

  return (
    <TableRow key={row.id}>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.id}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        {org?.name && <Typography variant="body2">{org?.name}</Typography>}
        <Typography variant="monospaceTableCell">
          {row.organizationID}
        </Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.threadID}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        {user?.name && <Typography variant="body2">{user?.name}</Typography>}
        <Typography variant="monospaceTableCell">{row.authorID}</Typography>
      </TableCell>
      <TableCell className={classes.noWrap}>
        <Typography variant="monospaceTableCell">{row.url ?? '-'}</Typography>
      </TableCell>
      <JSONCell json={row.content} />
      <TableCell className={cx(classes.noWrap, classes.plaintextCell)}>
        {row.plaintext}
      </TableCell>
      <TimestampCell time={row.createdTimestamp} />
      <TimestampCell time={row.updatedTimestamp} />
      <TimestampCell time={row.deletedTimestamp} />
      <TableCell>
        <Typography variant="monospaceTableCell">{row.type}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="monospaceTableCell">
          {row.extraClassnames}
        </Typography>
      </TableCell>
      <JSONCell json={row.attachments} />
      <JSONCell json={row.reactions} />
      <JSONCell json={row.metadata} />
      <MoreCell options={moreOptions} />
    </TableRow>
  );
}
