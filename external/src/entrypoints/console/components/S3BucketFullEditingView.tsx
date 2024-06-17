import { useCallback, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { createUseStyles } from 'react-jss';
import type { UUID } from 'common/types/index.ts';
import { useCreateApplicationS3BucketMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
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

export default function S3BucketFullEditingView({
  id,
  onClose,
  onSuccess,
}: {
  id: UUID;
  onSuccess: (message: string) => void;
  onClose: () => void;
}): React.ReactElement {
  const classes = useStyles();

  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [accessKeyID, setAccessKeyID] = useState('');
  const [accessKeySecret, setAccessKeySecret] = useState('');

  const [createBucket] = useCreateApplicationS3BucketMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSave = useCallback(
    async (
      applicationID: UUID,
      bucketValue: string,
      regionValue: string,
      accessKeyIDValue: string,
      accessKeySecretValue: string,
    ) => {
      const result = await createBucket({
        variables: {
          applicationID,
          bucket: bucketValue,
          region: regionValue,
          accessKeyID: accessKeyIDValue,
          accessKeySecret: accessKeySecretValue,
        },
      });

      if (!result.data?.createApplicationCustomS3Bucket.success) {
        setErrorMessage('An unexpected error has occurred. Please try again.');
      } else if (result.data?.createApplicationCustomS3Bucket.success) {
        onSuccess('Changes saved successfully.');
      }
    },
    [createBucket, onSuccess],
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(id, bucket, region, accessKeyID, accessKeySecret);
      }}
      className={classes.container}
    >
      <BoxRow label="Bucket name">
        <TextField
          type="text"
          placeholder="Bucket Name"
          value={bucket}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setBucket(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow label="Region">
        <TextField
          type="text"
          placeholder="Region"
          value={region}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRegion(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow label="Access Key ID">
        <TextField
          type="text"
          placeholder="ID"
          value={accessKeyID}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAccessKeyID(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow label="Access Key Secret">
        <TextField
          type="password"
          placeholder="Secret"
          value={accessKeySecret}
          required={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAccessKeySecret(e.target.value)
          }
          fullWidth
        />
      </BoxRow>
      <BoxRow>
        <div className={classes.buttonRow}>
          <Button variant="contained" type="submit">
            Save
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
