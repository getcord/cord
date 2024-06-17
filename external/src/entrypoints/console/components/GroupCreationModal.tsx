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

export function GroupCreationModal({
  isShown,
  onClose,
}: {
  isShown: boolean;
  onClose: () => void;
}) {
  const [isToastOpen, setToastOpen] = useState(false);

  const onToastClose = useCallback(
    (event: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setToastOpen(false);
    },
    [],
  );

  const onSubmitForm = useCallback(() => {
    setToastOpen(true);
    onClose();
  }, [onClose]);

  return (
    <>
      <Modal show={isShown} onHide={onClose}>
        <Modal.Header closeButton>
          <strong>Create group</strong>
        </Modal.Header>
        <GroupCreationForm onSuccess={onSubmitForm} />
      </Modal>
      <Toast
        message="Group created successfully"
        isOpen={isToastOpen}
        onClose={onToastClose}
      />
    </>
  );
}

export function GroupCreationForm({
  onSuccess,
  bodyText,
  setCreatedGroupData,
  includedMember,
}: {
  onSuccess: () => void;
  bodyText?: React.ReactNode;
  setCreatedGroupData?: (id: string) => void;
  includedMember?: string;
}) {
  const classes = useStyles();

  const [id, setID] = useState('');
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const checkIfUserExists = useCallback(async () => {
    if (!includedMember) {
      return;
    }
    const response = await fetch(`${API_ORIGIN}/v1/users/${includedMember}`, {
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
    throw new Error(
      'User to add to group does not exist. Verify the user has been created',
    );
  }, [application, includedMember]);

  const checkIfExists = useCallback(() => {
    if (!id) {
      return;
    }

    void fetch(`${API_ORIGIN}/v1/groups/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    }).then((response) => {
      if (response.status === 200) {
        setErrorMessage('A group with this ID already exists.');
      }
    });
  }, [application, id]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      setErrorMessage('');
      setIsSaving(true);
      e.preventDefault();

      try {
        await checkIfUserExists();
        const response = await fetch(`${API_ORIGIN}/v1/groups/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: name,
            members: includedMember ? [includedMember] : undefined,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application!.serverAccessToken}`,
            'X-Cord-Source': 'console',
          },
        });

        if (!response.ok) {
          console.error(response.text());
          throw new Error('Could not create group');
        }
        setCreatedGroupData?.(id);
        onSuccess();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'There was an error creating the group. Please try again';
        setErrorMessage(message);
      } finally {
        setIsSaving(false);
      }
    },
    [
      checkIfUserExists,
      id,
      name,
      includedMember,
      application,
      setCreatedGroupData,
      onSuccess,
    ],
  );

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <Modal.Body>
        <Stack direction="column" gap={1}>
          {bodyText}
          <FormControl className={classes.input}>
            <InputLabel size="small" shrink>
              Group ID
            </InputLabel>
            <TextField
              id="outlined-basic"
              autoComplete="off"
              disabled={isSaving}
              value={id}
              variant="outlined"
              placeholder="ID of your group"
              onChange={(e) => {
                setID(e.target.value);
              }}
              onBlur={checkIfExists}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <InputLabel size="small" shrink>
              Group name
            </InputLabel>
            <TextField
              id="outlined-basic"
              autoComplete="off"
              disabled={isSaving}
              value={name}
              variant="outlined"
              placeholder="Name of your group"
              onChange={(e) => {
                setName(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            {includedMember && (
              <>
                <InputLabel size="small" shrink>
                  Group member ID
                </InputLabel>
                <TextField
                  id="outlined-basic"
                  autoComplete="off"
                  disabled={true}
                  value={includedMember}
                  variant="outlined"
                  placeholder="ID of the group member"
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </>
            )}
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
        <Button
          type="submit"
          disabled={name.trim().length === 0 || errorMessage !== ''}
          variant="contained"
        >
          Create group
        </Button>
      </Modal.Footer>
    </form>
  );
}
