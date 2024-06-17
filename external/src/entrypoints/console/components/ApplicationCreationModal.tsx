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
import { useCreateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';

const useStyles = createUseStyles({
  input: {
    width: '100%',
  },
});

export function ApplicationCreationModal({
  isShown,
  onClose,
  onSave,
}: {
  isShown: boolean;
  onClose: () => void;
  onSave: (createdApplicationID: string) => void;
}) {
  return (
    <>
      <Modal show={isShown} onHide={onClose}>
        <Modal.Header closeButton>
          <strong>Create project</strong>
        </Modal.Header>
        <CreateAppForm onSuccess={onSave} />
      </Modal>
    </>
  );
}

export function CreateAppForm({
  onSuccess,
  bodyText,
}: {
  onSuccess: (createdApplicationID: string) => void;
  bodyText?: React.ReactNode;
}) {
  const classes = useStyles();

  const [name, setName] = useState('');
  const [errorCreating, setErrorCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [createApplicationMutation] = useCreateApplicationForConsoleMutation();

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      setErrorCreating(false);
      setIsSaving(true);
      e.preventDefault();

      const result = await createApplicationMutation({
        variables: { name: name.trim() },
      });
      const id = result.data?.createApplication;

      if (id) {
        onSuccess(id);
      } else {
        setErrorCreating(true);
        console.error(result.errors);
      }
      setIsSaving(false);
      return false;
    },
    [createApplicationMutation, name, onSuccess],
  );
  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <Modal.Body>
        <Stack direction="column" gap={1}>
          {bodyText}
          <FormControl className={classes.input}>
            <InputLabel size="small" shrink>
              Project name
            </InputLabel>
            <TextField
              id="outlined-basic"
              disabled={isSaving}
              value={name}
              variant="outlined"
              placeholder="Name of your project"
              onChange={(e) => {
                setName(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
          {errorCreating ? (
            <div>
              <Typography variant="body2" color="error">
                <Stack direction="row" gap={1}>
                  <ExclamationCircleIcon height={20} />{' '}
                  <span>
                    There was an error creating the project. Please try again.
                  </span>
                </Stack>
              </Typography>
            </div>
          ) : null}
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          disabled={name.trim().length === 0}
          variant="contained"
        >
          Create project
        </Button>
      </Modal.Footer>
    </form>
  );
}
