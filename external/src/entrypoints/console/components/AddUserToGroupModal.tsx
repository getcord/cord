import { useCallback, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

const useStyles = createUseStyles({
  input: {
    width: '100%',
  },
});

export function AddUserToGroupModal({
  groupID,
  isShown,
  onClose,
  onSuccess,
}: {
  groupID: string;
  isShown: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const classes = useStyles();

  const [userID, setUserID] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isToastOpen, setToastOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const onCloseModal = useCallback(() => {
    onClose();
    setUserID('');
    setErrorMessage('');
  }, [onClose]);

  const onToastClose = useCallback(
    (_event: React.SyntheticEvent | Event, _reason?: string) => {
      setToastOpen(false);
    },
    [],
  );

  const checkIfUserExists = useCallback(async () => {
    const response = await fetch(`${API_ORIGIN}/v1/users/${userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    });

    if (response.status === 200) {
      return true;
    }
    // TODO - maybe add a link to the users table here?
    throw new Error('User does not exist. Verify the user has been created');
  }, [application, userID]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      setErrorMessage('');
      setIsSaving(true);
      e.preventDefault();

      try {
        await checkIfUserExists();
        const response = await fetch(
          `${API_ORIGIN}/v1/groups/${groupID}/members`,
          {
            method: 'POST',
            body: JSON.stringify({
              add: [userID],
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${application!.serverAccessToken}`,
              'X-Cord-Source': 'console',
            },
          },
        );

        if (response.ok) {
          onCloseModal();
          setToastOpen(true);
          onSuccess();
        } else {
          console.error(response.text());
          throw new Error('Could not add user to group');
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Something went wrong');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [application, checkIfUserExists, groupID, onCloseModal, onSuccess, userID],
  );

  return (
    <>
      <Modal show={isShown} onHide={onCloseModal}>
        <Modal.Header closeButton>
          <strong>Add user to group</strong>
        </Modal.Header>
        <form onSubmit={(e) => void onSubmit(e)}>
          <Modal.Body>
            <Stack direction="column" gap={1}>
              <FormControl className={classes.input}>
                <InputLabel size="small" shrink>
                  User ID
                </InputLabel>
                <TextField
                  id="outlined-basic"
                  autoComplete="off"
                  disabled={isSaving}
                  value={userID}
                  variant="outlined"
                  placeholder="ID of your user"
                  onChange={(e) => {
                    setUserID(e.target.value);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </FormControl>
              {errorMessage && (
                <div>
                  <Stack direction="row" gap={1}>
                    <Typography variant="body2" color="error">
                      <ExclamationCircleIcon height={20} />{' '}
                      <span>{errorMessage}</span>
                    </Typography>
                  </Stack>
                </div>
              )}
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" variant="contained" disabled={!userID}>
              Add user to group
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
      <Toast
        message="User successfully added"
        isOpen={isToastOpen}
        onClose={onToastClose}
      />
    </>
  );
}
