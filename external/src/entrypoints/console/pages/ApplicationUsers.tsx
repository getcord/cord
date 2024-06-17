import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  CircularProgress,
  IconButton,
  Link,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { createUseStyles } from 'react-jss';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import EmptyUsersSVG from 'external/src/static/empty-users.svg';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import Clipboard from 'external/src/static/clipboard.svg';
import { TimestampCell } from 'external/src/entrypoints/console/components/TimestampCell.tsx';
import { DOCS_URLS } from 'common/const/Ids.ts';
import { API_ORIGIN, DOCS_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import type { ID, ServerListUser, ServerListUsers } from '@cord-sdk/types';
import type {
  GetDataResponse,
  RenderRowParams,
} from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { ConsoleDataTableWithPagination } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { UserCreationModal } from 'external/src/entrypoints/console/components/UserCreationModal.tsx';
import { MoreCell } from 'external/src/entrypoints/console/components/MoreCell.tsx';
import { DeletionConfirmationModal } from 'external/src/entrypoints/console/components/DeletionConfirmationModal.tsx';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';

const LIMIT_USERS = 30;
const HEADERS = [
  'ID',
  'Name',
  'Email',
  'Profile picture',
  'Status',
  'Created timestamp',
];

const useStyles = createUseStyles({
  buttonGroup: {
    display: 'flex',
    gap: 16,
    marginTop: Sizes.LARGE,
  },
  emptyUsersSvg: {
    maxWidth: '192px',
    color: Colors.BRAND_PURPLE_DARK,
    marginBlockEnd: Sizes.LARGE,
  },
  emptyUsersBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  emptyUsersContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
  },
  userCount: {
    display: 'flex',
    marginBlockEnd: Sizes.XLARGE,
    justifyContent: 'space-between',
  },
  tableTitle: {
    marginBlockEnd: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  profilePicture: {
    height: '24px',
    maxWidth: '24px',
    marginInlineEnd: Sizes.SMALL,
  },
  profilePictureURL: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
  },
  profilePictureCell: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.XSMALL,
    maxWidth: 350,
  },
  copyIcon: {
    width: 16,
  },
});

function EmptyUsers({ createUserButton }: { createUserButton: JSX.Element }) {
  const classes = useStyles();
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  return (
    <Box className={classes.emptyUsersBox}>
      <section className={classes.emptyUsersContainer}>
        <EmptyUsersSVG className={classes.emptyUsersSvg} />
        <Typography variant="body2">
          <strong>{`There are 0 users sync’d ${
            application?.name ? `with ${application?.name}` : null
          }`}</strong>
        </Typography>
        <Typography variant="body2">
          For a guide to authenticating users, take a look at our API Docs
        </Typography>
        <div className={classes.buttonGroup}>
          {createUserButton}
          <Button
            variant="outlined"
            href={DOCS_URLS.getStarted.authenticateYourUser}
            target="_blank"
          >
            How to Authenticate Users
          </Button>
        </div>
      </section>
    </Box>
  );
}

type UserToBeDeleted = {
  userID: ID;
  refetch: () => Promise<void>;
};

export function ApplicationUsers() {
  const classes = useStyles();

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [userCount, setUserCount] = useState<number | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] =
    useState<boolean>(false);
  const [showDeleteUserModal, setShowDeleteUserModal] =
    useState<boolean>(false);
  const [userToBeDeleted, setUserToBeDeleted] =
    useState<UserToBeDeleted | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  const fetchUsers = useCallback(
    async (token: string | null): Promise<GetDataResponse<ServerListUser>> => {
      const appendToken = token ? `&token=${token}` : '';
      const url = new URL(
        `${API_ORIGIN}/v1/users/?limit=${LIMIT_USERS}${appendToken}`,
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application!.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      const typedResponse = (await response.json()) as ServerListUsers;

      setUserCount(typedResponse.pagination.total);

      return {
        data: typedResponse.users.filter((user) => user.id !== null),
        totalItems: typedResponse.pagination.total,
        token: typedResponse.pagination.token,
      };
    },
    [application],
  );

  useEffect(() => {
    void fetchUsers(null);
  }, [fetchUsers]);

  const queryKey = useMemo(
    () => ['console-users', `application-${application?.id}`],
    [application],
  );

  const createUserButton = useMemo(() => {
    return (
      <Button
        variant="contained"
        onClick={() => {
          setShowCreateUserModal(true);
        }}
      >
        Create user
      </Button>
    );
  }, []);

  const onCloseModal = useCallback(() => {
    setShowCreateUserModal(false);
  }, []);

  const onDeletionClicked = useCallback(
    (userID: ID, refetch: () => Promise<void>) => {
      setShowDeleteUserModal(true);
      setUserToBeDeleted({
        userID,
        refetch,
      });
    },
    [],
  );

  const hideDeletionModal = useCallback(() => {
    setShowDeleteUserModal(false);
    setUserToBeDeleted(null);
  }, []);

  const deleteUser = useCallback(async () => {
    setErrorMessage('');
    try {
      if (!userToBeDeleted) {
        throw new Error('No user selected');
      }
      const response = await fetch(
        `${API_ORIGIN}/v1/users/${userToBeDeleted.userID}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            permanently_delete: true,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application!.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
        },
      );

      if (response.ok) {
        setToastOpen(true);
        await userToBeDeleted.refetch();
        return;
      }
      // An error has occured!
      const resultString = await response.text();
      const result = JSON.parse(resultString);
      if ('error' in result && result.error === 'invalid_user_id') {
        throw new Error('User not found, try refreshing the page');
      }
      throw new Error('Something went wrong with deleting a user');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong with deleting a user');
      }
    } finally {
      hideDeletionModal();
      setToastOpen(true);
    }
  }, [application, hideDeletionModal, userToBeDeleted]);

  const onToastClose = useCallback(
    (_event: React.SyntheticEvent | Event, _reason?: string) => {
      setToastOpen(false);
    },
    [],
  );

  if (!application) {
    return <CircularProgress size="16px" />;
  }

  if (userCount === null) {
    return <CircularProgress size="16px" />;
  }

  return (
    <Main header={<Header text={'Users'} />}>
      <section className={classes.tableTitle}>
        <ApiInformationBlock
          url="https://api.cord.com/v1/users"
          docsLink="/rest-apis/users"
          cliCommand="cord user"
        />
        {userCount > 0 ? (
          <div className={classes.userCount}>
            <Typography variant="body1">
              <strong>{userCount} users</strong>
              {application ? ` for ${application?.name}` : null}
            </Typography>
            {createUserButton}
          </div>
        ) : null}
      </section>
      {userCount > 0 ? (
        <ConsoleDataTableWithPagination
          headers={HEADERS}
          getData={fetchUsers}
          renderRow={(rowData: RenderRowParams<ServerListUser>) => (
            <Row
              row={rowData.row}
              key={rowData.row.id}
              refetch={rowData.refetch}
              onDeletionClicked={onDeletionClicked}
            />
          )}
          queryKey={queryKey}
          key={userCount}
        />
      ) : (
        <EmptyUsers createUserButton={createUserButton} />
      )}
      <UserCreationModal
        isShown={showCreateUserModal}
        onClose={onCloseModal}
        onSuccess={() => void fetchUsers(null)}
      />
      <DeletionConfirmationModal
        header={
          userToBeDeleted
            ? `Delete user: ${userToBeDeleted.userID}`
            : 'Delete user?'
        }
        body={
          <Typography variant="body2">
            Deleting a user will delete the user <strong>permanently</strong> .
            This can not be undone. Press Delete to confirm or Cancel to back
            out. For more information refer to{' '}
            <Link
              to={`${DOCS_ORIGIN}/rest-apis/users#Delete-a-user`}
              component={RouterLink}
              target="_blank"
              rel="noreferrer"
            >
              User REST API
            </Link>
          </Typography>
        }
        visible={showDeleteUserModal}
        onCancel={hideDeletionModal}
        onDelete={() => {
          void deleteUser();
        }}
      />
      <Toast
        message={errorMessage ? errorMessage : 'Successfully deleted user'}
        isOpen={toastOpen}
        onClose={onToastClose}
      />
    </Main>
  );
}

function Row({
  row,
  refetch,
  onDeletionClicked,
}: {
  row: ServerListUser;
  refetch: () => Promise<void>;
  onDeletionClicked: (userID: ID, refetch: () => Promise<void>) => void;
}) {
  const [profilePictureError, setProfilePictureError] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
  }, []);

  const classes = useStyles();

  const moreOptions = [
    {
      text: 'Delete user permanently',
      callback: () => {
        onDeletionClicked(row.id, refetch);
      },
    },
  ];

  return (
    <TableRow key={row.id}>
      <TableCell>
        <Typography variant="monospaceTableCell">{row.id}</Typography>
      </TableCell>
      <TableCell sx={{ textWrap: 'nowrap' }}>{row.name}</TableCell>
      <TableCell sx={{ textWrap: 'nowrap' }}>{row.email}</TableCell>
      <TableCell sx={{ textWrap: 'nowrap' }}>
        <div className={classes.profilePictureCell}>
          {row.profilePictureURL && profilePictureError ? (
            <img
              src={row.profilePictureURL}
              alt="profile picture"
              className={classes.profilePicture}
              onError={() => {
                setProfilePictureError(true);
              }}
            />
          ) : null}
          <Typography
            variant="monospaceTableCell"
            className={classes.profilePictureURL}
          >
            {row.profilePictureURL}
          </Typography>
          {row.profilePictureURL ? (
            <IconButton
              aria-label="Copy to clipboard"
              onClick={() => copyToClipboard(row.profilePictureURL!)}
            >
              <Clipboard className={classes.copyIcon} />
            </IconButton>
          ) : null}
        </div>
      </TableCell>
      <TableCell sx={{ textWrap: 'nowrap' }}>
        {row.status
          ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
          : 'Unkwnown'}
      </TableCell>
      <TimestampCell time={row.createdTimestamp as unknown as string} />
      <MoreCell options={moreOptions} />
    </TableRow>
  );
}
