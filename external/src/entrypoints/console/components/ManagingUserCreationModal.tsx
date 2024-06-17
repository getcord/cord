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
import { useAddConsoleUserToCustomerMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';

const useStyles = createUseStyles({
  input: {
    width: '100%',
  },
});

export function ManagingUserCreationModal({
  isShown,
  onClose,
  refetch,
  onSuccess,
}: {
  isShown: boolean;
  onClose: () => void;
  refetch: () => void;
  onSuccess: () => void;
}) {
  const classes = useStyles();

  const [addConsoleUserToCustomer] = useAddConsoleUserToCustomerMutation();
  const [userEmail, setUserEmail] = useState('');
  const [called, setCalled] = useState(false);
  const [invalidResponse, setInvalidResponse] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined | null>(
    null,
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setInvalidResponse(null);
      setCalled(true);
      setErrorMessage(null);

      void addConsoleUserToCustomer({
        variables: { email: userEmail.trim() },
      }).then((response) => {
        const result = response?.data?.addConsoleUserToCustomer;
        setCalled(false);
        if (!result?.success) {
          setInvalidResponse(true);
          const message = result?.failureDetails?.message;
          setErrorMessage(message);
          console.error(message);
        } else {
          onClose();
          setUserEmail('');
          onSuccess();
          void refetch();
        }
      });
    },
    [addConsoleUserToCustomer, userEmail, onClose, onSuccess, refetch],
  );

  return (
    <Modal show={isShown} onHide={onClose}>
      <Modal.Header closeButton>
        <strong>Add member</strong>
      </Modal.Header>
      <form onSubmit={(e) => void onSubmit(e)}>
        <Modal.Body>
          <Stack direction="column" spacing={1}>
            <FormControl className={classes.input}>
              <InputLabel size="small" shrink>
                Email
              </InputLabel>
              <TextField
                type="email"
                disabled={called}
                id="outlined-basic"
                value={userEmail}
                variant="outlined"
                placeholder="alice@example.com"
                onChange={(e) => {
                  setUserEmail(e.target.value);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
            {invalidResponse ? (
              <Typography variant="body2" color="error">
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  alignItems="flex-end"
                  spacing={1}
                >
                  <ExclamationCircleIcon
                    style={{
                      height: 20,
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}
                  />{' '}
                  <span>
                    An error occurred when adding the user
                    {errorMessage ? `: ${errorMessage}` : null}
                  </span>
                </Stack>
              </Typography>
            ) : null}
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="submit"
            disabled={userEmail.length === 0}
            variant="contained"
          >
            Add
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
