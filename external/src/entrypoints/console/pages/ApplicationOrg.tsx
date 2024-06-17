import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  IconButton,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Sizes } from 'common/const/Sizes.ts';

import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { ConsoleDataTable } from 'external/src/entrypoints/console/components/ConsoleDataTable.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import Main from 'external/src/entrypoints/console/ui/Main.tsx';
import Header from 'external/src/entrypoints/console/ui/Header.tsx';
import { useGetApplicationOrg } from 'external/src/entrypoints/console/hooks/useGetApplicationOrg.tsx';
import { AddUserToGroupModal } from 'external/src/entrypoints/console/components/AddUserToGroupModal.tsx';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import type { GetDataResponse } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import { ConsoleDataTableWithPagination } from 'external/src/entrypoints/console/components/ConsoleDataTableWithPagination.tsx';
import type {
  ServerListGroupMember,
  ServerListGroupMembers,
} from '@cord-sdk/types';
import { MoreCell } from 'external/src/entrypoints/console/components/MoreCell.tsx';
import Clipboard from 'external/src/static/clipboard.svg';
import { ApiInformationBlock } from 'external/src/entrypoints/console/components/ApiInformationBlock.tsx';

const GROUP_MEMBERS_HEADERS = [
  'ID',
  'Name',
  'Email',
  'Profile picture',
  'Status',
  'Short name',
];

const LIMIT_USERS = 15;
const useStyles = createUseStyles({
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
  tableTitle: {
    marginBlockEnd: Sizes.XLARGE,
    display: 'flex',
    justifyContent: 'space-between',
  },
});

export function ApplicationOrg() {
  const classes = useStyles();
  const { orgID } = useUnsafeParams<{ orgID: string }>();

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );
  const [showAddUserToGroupModal, setShowAddUserToGroupModal] =
    useState<boolean>(false);
  const [isToastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [usersInGroupCount, setUsersInGroupCount] = useState<number | null>(
    null,
  );

  const onToastClose = useCallback(
    (_event: React.SyntheticEvent | Event, _reason?: string) => {
      setToastOpen(false);
    },
    [],
  );

  const { org, refetch: refetchOrg } = useGetApplicationOrg(orgID);

  const removeUserFromGroup = useCallback(
    async (userID: string, refetchUsers: () => Promise<void>) => {
      const url = new URL(`${API_ORIGIN}/v1/groups/${orgID}/members`);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application!.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
          body: JSON.stringify({
            remove: [userID],
          }),
        });

        if (response.ok) {
          void refetchUsers();
          void refetchOrg();
          setToastMessage('User successfully removed');
          return;
        }

        console.error(response.text());
        throw new Error('Could not add user to group');
      } catch (error) {
        if (error instanceof Error) {
          setToastMessage(error.message);
        }
      } finally {
        setToastOpen(true);
      }
    },

    [application, orgID, refetchOrg],
  );

  const fetchGroupMembers = useCallback(
    async (
      token: string | null,
    ): Promise<GetDataResponse<ServerListGroupMember>> => {
      const appendToken = token ? `&token=${token}` : '';

      const url = new URL(
        `${API_ORIGIN}/v1/groups/${orgID}/members?limit=${LIMIT_USERS}${appendToken}`,
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application!.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      const typedResponse = (await response.json()) as ServerListGroupMembers;
      setUsersInGroupCount(typedResponse.pagination.total);

      return {
        data: typedResponse.users,
        totalItems: typedResponse.pagination.total,
        token: typedResponse.pagination.token,
      };
    },
    [application, orgID],
  );

  const queryKey = useMemo(
    () => [
      'console-org-members',
      `application-${application?.id}`,
      `org-${orgID}`,
    ],
    [application?.id, orgID],
  );

  // Had to destructure it for the type to work
  const orgData = useMemo(() => {
    if (!org) {
      return [];
    }
    return [{ ...org }];
  }, [org]);

  const onCloseModal = useCallback(() => setShowAddUserToGroupModal(false), []);
  return (
    <Main header={<Header text={`Group Details: ${orgID}`} />}>
      {org ? (
        <>
          <ConsoleDataTable data={orgData} />
          <div className={classes.tableTitle}>
            <Typography variant="body1">
              <strong>{`${usersInGroupCount} ${
                usersInGroupCount === 1 ? 'user' : 'users'
              }`}</strong>{' '}
              in group
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setShowAddUserToGroupModal(true);
              }}
            >
              Add user to group
            </Button>
          </div>
          <ApiInformationBlock
            url={`https://api.cord.com/v1/groups/${orgID}/members`}
            docsLink="/rest-apis/groups"
            cliCommand={`cord group get-members ${orgID}`}
          />
          <ConsoleDataTableWithPagination
            queryKey={queryKey}
            headers={GROUP_MEMBERS_HEADERS}
            getData={fetchGroupMembers}
            key={usersInGroupCount}
            renderRow={({ row, refetch }) => (
              <GroupMemberRow
                key={row.id}
                row={row}
                refetch={refetch}
                onRemoveUser={removeUserFromGroup}
              />
            )}
          />
          <AddUserToGroupModal
            groupID={orgID}
            isShown={showAddUserToGroupModal}
            onClose={onCloseModal}
            onSuccess={() => {
              void fetchGroupMembers(null);
              void refetchOrg();
            }}
          />
          <Toast
            message={toastMessage}
            isOpen={isToastOpen}
            onClose={onToastClose}
          />
        </>
      ) : (
        <Typography variant="body1">Could not find group</Typography>
      )}
    </Main>
  );
}

function GroupMemberRow({
  row,
  refetch,
  onRemoveUser,
}: {
  row: ServerListGroupMember;
  refetch: () => Promise<void>;
  onRemoveUser: (userID: string, refetch: () => Promise<void>) => Promise<void>;
}) {
  const classes = useStyles();

  const [profilePictureError, setProfilePictureError] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
  }, []);

  const moreOptions = [
    {
      text: 'Remove from group',
      callback: () => {
        void onRemoveUser(row.id.toString(), refetch);
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
      <TableCell>{row.shortName}</TableCell>
      <MoreCell options={moreOptions} />
    </TableRow>
  );
}
