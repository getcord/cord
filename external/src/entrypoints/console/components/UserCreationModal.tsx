import { useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  FormControl,
  InputLabel,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { API_ORIGIN, DOCS_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  input: {
    width: '100%',
  },
});

export function UserCreationModal({
  isShown,
  onClose,
  onSuccess,
}: {
  isShown: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isToastOpen, setToastOpen] = useState(false);

  const onToastClose = useCallback(
    (_event: React.SyntheticEvent | Event, _reason?: string) => {
      setToastOpen(false);
    },
    [],
  );

  const onCreateUser = useCallback(() => {
    setToastOpen(true);
    onSuccess();
    // leaving this here as it's where we close the modal
    onClose();
  }, [onClose, onSuccess]);

  return (
    <>
      <Modal show={isShown} onHide={onClose}>
        <Modal.Header closeButton>
          <strong>Create user</strong>
        </Modal.Header>
        <UserCreationForm onSuccess={onCreateUser} />
      </Modal>
      <Toast
        message="User created successfully"
        isOpen={isToastOpen}
        onClose={onToastClose}
      />
    </>
  );
}

export function UserCreationForm({
  onSuccess,
  bodyText,
  setCreatedUser,
}: {
  onSuccess: () => void;
  bodyText?: React.ReactNode;
  setCreatedUser?: (id: string) => void;
}) {
  const classes = useStyles();

  const [id, setID] = useState('');
  const [name, setName] = useState('');
  const [errorCreating, setErrorCreating] = useState(false);
  const [idAlreadyExists, setIdAlreadyExists] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const checkIfExists = useCallback(() => {
    if (!id) {
      return;
    }

    void fetch(`${API_ORIGIN}/v1/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    }).then((response) => {
      if (response.status === 200) {
        setIdAlreadyExists(true);
      }
    });
  }, [application, id]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      setErrorCreating(false);
      setIsSaving(true);
      e.preventDefault();

      const response = await fetch(`${API_ORIGIN}/v1/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${application!.serverAccessToken}`,
          'X-Cord-Source': 'console',
        },
      });

      if (response.ok) {
        setCreatedUser?.(id);
        onSuccess();
      } else {
        setErrorCreating(true);
        console.error(response.text());
      }
      setIsSaving(false);
      return false;
    },
    [application, id, name, onSuccess, setCreatedUser],
  );

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <Modal.Body>
        {!bodyText ? (
          <Typography variant="body2" mb={`${Sizes.LARGE}px`}>
            This should be used for development purposes only. Please refer to
            the{' '}
            <Link
              target="_blank"
              rel="noreferrer"
              to={`${DOCS_ORIGIN}/rest-apis/users`}
              component={RouterLink}
            >
              Users REST API
            </Link>{' '}
          </Typography>
        ) : (
          bodyText
        )}

        <Stack direction="column" gap={1}>
          <FormControl className={classes.input}>
            <InputLabel size="small" shrink>
              User ID
            </InputLabel>
            <TextField
              id="outlined-basic"
              autoComplete="off"
              disabled={isSaving}
              value={id}
              variant="outlined"
              placeholder="ID of your user"
              onChange={(e) => {
                setIdAlreadyExists(false);
                setID(e.target.value);
              }}
              onBlur={checkIfExists}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
          <FormControl className={classes.input}>
            <InputLabel size="small" shrink>
              User name
            </InputLabel>
            <TextField
              id="outlined-basic"
              autoComplete="off"
              disabled={isSaving}
              value={name}
              variant="outlined"
              placeholder="Name of your user"
              onChange={(e) => {
                setName(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
          {(errorCreating || idAlreadyExists) && (
            <div>
              <Stack direction="row" gap={1}>
                <Typography variant="body2" color="error">
                  <ExclamationCircleIcon height={20} />{' '}
                  <span>
                    {errorCreating
                      ? 'There was an error creating the user. Please try again'
                      : 'A user with this ID already exists.'}
                  </span>
                </Typography>
              </Stack>
            </div>
          )}
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          disabled={name.trim().length === 0 || idAlreadyExists}
          variant="contained"
        >
          Create user
        </Button>
      </Modal.Footer>
    </form>
  );
}
