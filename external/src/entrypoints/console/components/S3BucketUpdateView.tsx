import { useState, useCallback } from 'react';
import { Button, TextField } from '@mui/material';
import { createUseStyles } from 'react-jss';
import type { UUID } from 'common/types/index.ts';
import { useUpdateApplicationS3BucketSecretMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.LARGE,
    width: '100%',
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: Sizes.MEDIUM,
  },
});

export default function S3BucketUpdateView({
  applicationID,
  s3BucketId,
  onSuccess,
  onClose,
}: {
  applicationID: UUID;
  s3BucketId: UUID;
  onSuccess: (message: string) => void;
  onClose: () => void;
}) {
  const classes = useStyles();

  const [secret, setSecret] = useState<string>('');
  const [keyID, setKeyID] = useState<string>('');

  const [updateSecret] = useUpdateApplicationS3BucketSecretMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSave = useCallback(
    async (id: UUID, keyIDValue: string, keySecret: string) => {
      const result = await updateSecret({
        variables: { applicationID, id, keyID: keyIDValue, keySecret },
      });
      if (!result.data?.updateCustomS3BucketSecret.success) {
        setErrorMessage('An unexpected error has occurred. Please try again.');
      } else if (result.data?.updateCustomS3BucketSecret.success) {
        onSuccess('Changes saved successfully.');
      }
    },
    [updateSecret, applicationID, onSuccess],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(s3BucketId, keyID, secret);
      }}
      className={classes.container}
    >
      <BoxRow label="Access Key ID">
        <TextField
          type="text"
          placeholder="ID"
          value={keyID}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setKeyID(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow label="Access Key Secret">
        <TextField
          type="password"
          placeholder="Secret"
          value={secret}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSecret(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow>
        <div className={classes.buttonRow}>
          <Button variant="contained" type="submit">
            Update
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </BoxRow>
      <SubmitFormResultMessage
        errorMessage={errorMessage}
        clearErrorMessage={() => setErrorMessage(null)}
        successMessage={null}
        clearSuccessMessage={() => {}}
        warningMessage={null}
        clearWarningMessage={() => {}}
      />
    </form>
  );
}
