import { Helmet } from 'react-helmet';
import {
  Button,
  CircularProgress,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { TableBody } from '@material-ui/core';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { useCallback, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { ConsoleUsersQueryResult } from 'external/src/entrypoints/console/graphql/operations.ts';
import {
  useConsoleUserQuery,
  useConsoleUsersQuery,
  useRemoveConsoleUserFromCustomerMutation,
  useUpdateAccessToCustomerMutation,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { ManagingUserCreationModal } from 'external/src/entrypoints/console/components/ManagingUserCreationModal.tsx';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { getPrettyCustomerName } from 'external/src/entrypoints/console/utils.ts';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { Colors } from 'common/const/Colors.ts';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

const useStyles = createUseStyles({
  boxContent: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: Sizes.XLARGE,
  },
  boxHeader: {
    marginBlockEnd: Sizes.LARGE,
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${Sizes.XLARGE}px`,
  },
  table: {
    '& td:last-child': {
      width: '1%',
      whiteSpace: 'nowrap',
    },
  },
  userCount: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  buttonGroup: {
    display: 'flex',
    gap: 16,
  },
  pendingUser: {
    '& > td': {
      color: Colors.PURPLE_DARK,
    },
  },
});

function OptionsButton({
  email,
  refetch,
  setToastMessage,
  loggedInUser,
}: {
  email: string;
  refetch: () => void;
  setToastMessage: (toastMessage: string) => void;
  loggedInUser: boolean;
}) {
  const [removeConsoleUserFromCustomer] =
    useRemoveConsoleUserFromCustomerMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const onRevokeAccessClick = useCallback(() => {
    if (loggedInUser) {
      setToastMessage('Unable to revoke your own access');
      handleClose();
      return;
    }
    void removeConsoleUserFromCustomer({
      variables: { email: email },
    }).then((response) => {
      if (response?.data?.removeConsoleUserFromCustomer?.success) {
        void refetch();
        handleClose();
        setToastMessage('User access revoked');
      } else {
        setToastMessage(
          'Something went wrong with revoking access, try refreshing the page',
        );
      }
    });
  }, [
    email,
    handleClose,
    refetch,
    removeConsoleUserFromCustomer,
    setToastMessage,
    loggedInUser,
  ]);

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        sx={{
          boxShadow: 'none',
          minWidth: '0',
          padding: '10px',
          float: 'right',
        }}
        onClick={handleClick}
      >
        <EllipsisHorizontalIcon style={{ height: 20 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem key="revoke-access">
          <ListItemText onClick={onRevokeAccessClick}>
            Revoke access
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function UserRow({
  row,
  refetchUsers,
  setToastMessage,
  loggedInUser,
}: {
  row: {
    id: string;
    email: string;
    name: string | null;
    pendingCustomerID: string | null;
  };
  refetchUsers: () => void;
  setToastMessage: (toastMessage: string) => void;
  loggedInUser: boolean;
}) {
  const classes = useStyles();
  const [updateAccessToCustomer] = useUpdateAccessToCustomerMutation();

  const onGrantAccessClick = useCallback(() => {
    void updateAccessToCustomer({
      variables: { email: row.email, approveAccess: true },
    }).then((response) => {
      if (response.data?.updateAccessToCustomer.success) {
        void refetchUsers();
        setToastMessage('User access granted');
      } else {
        setToastMessage(
          'Something went wrong when granting access, try refreshing the page',
        );
      }
    });
  }, [updateAccessToCustomer, row.email, refetchUsers, setToastMessage]);

  const onDenyAccessClick = useCallback(() => {
    void updateAccessToCustomer({
      variables: { email: row.email, approveAccess: false },
    }).then((response) => {
      if (response.data?.updateAccessToCustomer.success) {
        void refetchUsers();
        setToastMessage('User access denied');
      } else {
        setToastMessage(
          'Something went wrong when denying access, try refreshing the page',
        );
      }
    });
  }, [refetchUsers, row.email, setToastMessage, updateAccessToCustomer]);

  return (
    <TableRow
      className={row.pendingCustomerID ? classes.pendingUser : undefined}
    >
      <TableCell>{row.email}</TableCell>
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.pendingCustomerID ? 'pending' : 'approved'}</TableCell>
      <TableCell>
        {row.pendingCustomerID ? (
          <div className={classes.buttonGroup}>
            <Button variant="contained" onClick={onGrantAccessClick}>
              Grant Access
            </Button>
            <Button onClick={onDenyAccessClick}>Deny Access</Button>
          </div>
        ) : (
          <OptionsButton
            email={row.email}
            refetch={refetchUsers}
            setToastMessage={setToastMessage}
            loggedInUser={loggedInUser}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

function UsersTable({
  data,
  loading,
  refetchUsers,
  setToastMessage,
  onAddSeatClick,
  loggedInUserEmail,
}: {
  data: ConsoleUsersQueryResult | undefined;
  loading: boolean;
  refetchUsers: () => void;
  setToastMessage: (toastMessage: string) => void;
  onAddSeatClick: () => void;
  loggedInUserEmail: string | undefined;
}) {
  const classes = useStyles();

  const { data: userData, loading: userLoading } = useConsoleUserQuery();

  const numUsers = data?.customerConsoleUsers.length;

  return loading || userLoading ? (
    <CircularProgress />
  ) : (
    <div className={classes.tableContainer}>
      <div className={classes.userCount}>
        <Typography variant="body1">
          <strong>
            {numUsers} {numUsers === 1 ? 'seat' : 'seats'}
          </strong>{' '}
          in {getPrettyCustomerName(userData?.consoleUser?.customer?.name)}
        </Typography>
        <Button variant="contained" onClick={onAddSeatClick}>
          Add seat
        </Button>
      </div>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Email</strong>
              </TableCell>
              <TableCell>
                <strong>Access</strong>
              </TableCell>
              <TableCell>
                <strong></strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.customerConsoleUsers.map((row, index) => (
              <UserRow
                row={row}
                key={index}
                refetchUsers={refetchUsers}
                setToastMessage={setToastMessage}
                loggedInUser={loggedInUserEmail === row.email}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export function UserManagement() {
  const classes = useStyles();
  const [isUserCreationModalShown, setIsUserCreationModalShown] =
    useState(false);
  const { data, loading, refetch } = useConsoleUsersQuery();
  const { user } = useAuth0();

  const [toastMessage, setToastMessage] = useState<string>('');

  const refetchUsers = useCallback(() => {
    void refetch();
  }, [refetch]);

  const onAddSeatSuccess = useCallback(() => {
    setToastMessage('Seat has been added to team');
  }, []);

  return (
    <Box>
      <div className={classes.boxContent}>
        <Helmet>
          <title>Seats</title>
        </Helmet>
        <section className={classes.boxHeader}>
          <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
            Your Team Seat Details
          </Typography>
          <Typography variant="body2" mt={8 / SPACING_BASE}>
            Details relating to your Cord admin users
          </Typography>
        </section>
        <div>
          <UsersTable
            data={data}
            loading={loading}
            refetchUsers={refetchUsers}
            setToastMessage={setToastMessage}
            onAddSeatClick={() => setIsUserCreationModalShown(true)}
            loggedInUserEmail={user?.email}
          />
        </div>
        <ManagingUserCreationModal
          refetch={refetchUsers}
          isShown={isUserCreationModalShown}
          onClose={() => {
            setIsUserCreationModalShown(false);
          }}
          onSuccess={onAddSeatSuccess}
        />
        <Toast
          message={toastMessage}
          isOpen={Boolean(toastMessage)}
          onClose={() => setToastMessage('')}
        />
      </div>
    </Box>
  );
}
