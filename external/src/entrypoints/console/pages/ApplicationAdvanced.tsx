import { useCallback, useState, useEffect } from 'react';
import { Button, Link, TextField, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import type {
  UpdateApplicationForConsoleMutationVariables,
  S3BucketFragment,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import S3BucketUpdateView from 'external/src/entrypoints/console/components/S3BucketUpdateView.tsx';
import S3BucketFullEditingView from 'external/src/entrypoints/console/components/S3BucketFullEditingView.tsx';
import DeleteBucketModal from 'external/src/entrypoints/console/components/DeleteBucketModal.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import type { Nullable } from 'common/types/index.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.LARGE,
  },
  segmentForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.LARGE,
  },
  savedDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.LARGE,
    width: '100%',
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: Sizes.MEDIUM,
    justifyContent: 'flex-end',
  },
  submitMessage: {
    width: '100%',
  },
});

function CustomizeS3Bucket({
  bucket,
  refetchApplication,
}: {
  bucket: Nullable<S3BucketFragment>;
  refetchApplication: () => void;
}) {
  const classes = useStyles();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [s3EditingMode, setS3EditingMode] = useState<
    'none' | 'full_details' | 'secret'
  >('none');
  const [s3DeleteModalShown, setS3DeleteModalShown] = useState(false);

  const { id } = useContextThrowingIfNoProvider(ConsoleApplicationContext);

  const onSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      void refetchApplication();
      setS3EditingMode('none');
    },
    [refetchApplication],
  );

  const editFullDetails = useCallback(() => {
    setS3EditingMode('full_details');
  }, []);

  const editSecret = useCallback(() => {
    setS3EditingMode('secret');
  }, []);

  const onEditStop = useCallback(() => {
    setS3EditingMode('none');
  }, []);

  const onRemoveBucketClick = useCallback(() => {
    setS3DeleteModalShown(true);
    onEditStop();
  }, [onEditStop]);

  if (!bucket && s3EditingMode === 'none') {
    return (
      <Button
        variant="contained"
        onClick={editFullDetails}
        disabled={s3EditingMode !== 'none'}
      >
        Set Up Custom S3 Bucket
      </Button>
    );
  }

  return (
    <>
      {s3EditingMode === 'none' && bucket && (
        <div className={classes.savedDetails}>
          <BoxRow label="Bucket name">
            <TextField
              type="text"
              value={bucket?.name}
              disabled={true}
              fullWidth
            />
          </BoxRow>
          <BoxRow label="Bucket Region">
            <TextField
              type="text"
              value={bucket?.region}
              disabled={true}
              fullWidth
            />
          </BoxRow>
          <BoxRow>
            <div className={classes.buttonRow}>
              <Button onClick={editSecret} variant="contained">
                Update Bucket Secret
              </Button>
              <Button onClick={editFullDetails} variant="contained">
                Replace Bucket
              </Button>
              <Button variant="alert" onClick={onRemoveBucketClick}>
                Remove Bucket
              </Button>
            </div>
          </BoxRow>
          <SubmitFormResultMessage
            className={classes.submitMessage}
            errorMessage={null}
            clearErrorMessage={() => {}}
            successMessage={successMessage}
            clearSuccessMessage={() => setSuccessMessage(null)}
            warningMessage={null}
            clearWarningMessage={() => {}}
          />
        </div>
      )}
      {s3EditingMode === 'secret' && bucket && (
        <S3BucketUpdateView
          applicationID={id!}
          s3BucketId={bucket.id}
          onSuccess={onSuccess}
          onClose={onEditStop}
        />
      )}
      {s3EditingMode === 'full_details' && (
        <S3BucketFullEditingView
          id={id!}
          onSuccess={onSuccess}
          onClose={onEditStop}
        />
      )}
      <DeleteBucketModal
        id={id!}
        isShown={s3DeleteModalShown}
        onClose={() => setS3DeleteModalShown(false)}
        reload={(...args) => void refetchApplication(...args)}
      />
    </>
  );
}

export default function ApplicationAdvanced() {
  const classes = useStyles();

  const { application, refetch, id } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [updateApplication] = useUpdateApplicationForConsoleMutation();

  const [writeKey, setWriteKey] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const { enableCustomS3Bucket, enableCustomSegmentWriteKey } =
    useContextThrowingIfNoProvider(CustomerInfoContext);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();

      const variables: UpdateApplicationForConsoleMutationVariables = {
        id: id!,
        segmentWriteKey: writeKey,
        iconURL: undefined,
        name: undefined,
        customEmailTemplate: undefined,
        enableEmailNotifications: undefined,
        customLinks: undefined,
        customNUX: undefined,
        redirectURI: undefined,
        eventWebhookURL: undefined,
        eventWebhookSubscriptions: undefined,
      };

      const result = await updateApplication({ variables });
      if (result.data?.updateApplication.success === false) {
        setErrorMessage('An unexpected error has occurred. Please try again.');
      }
      if (!result.errors && result.data?.updateApplication.success === true) {
        setSuccessMessage('Changes saved successfully.');
        void refetch();
      }
    },
    [id, refetch, updateApplication, writeKey],
  );

  useEffect(() => {
    setWriteKey(application?.segmentWriteKey ?? null);
  }, [application?.segmentWriteKey]);

  const refetchApplication = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className={classes.container}>
      <Box>
        <Typography variant="h3">Segment Events</Typography>
        <Typography>
          To have Cord forward user interaction events to your Segment instance,
          please provide a write key. For more information please refer to the{' '}
          <Link
            href={`${DOCS_ORIGIN}/customization/segment-event-logging`}
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </Link>
          .
        </Typography>
        {enableCustomSegmentWriteKey ? (
          <form onSubmit={onSubmit} className={classes.segmentForm}>
            <BoxRow label="Segment Write Key">
              <TextField
                type="text"
                value={writeKey ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWriteKey(e.target.value)
                }
                fullWidth
              />
            </BoxRow>
            <BoxRow>
              <div>
                <Button variant="contained" type="submit">
                  Save
                </Button>
              </div>
            </BoxRow>
            <SubmitFormResultMessage
              errorMessage={errorMessage}
              clearErrorMessage={() => setErrorMessage(null)}
              successMessage={successMessage}
              clearSuccessMessage={() => setSuccessMessage(null)}
              warningMessage={warningMessage}
              clearWarningMessage={() => setWarningMessage(null)}
            />
          </form>
        ) : (
          <Typography>
            Contact{' '}
            <Link href="mailto:partner-support@cord.com">
              partner-support@cord.com
            </Link>{' '}
            to enable this premium feature.
          </Typography>
        )}
      </Box>
      <Box>
        <Typography variant="h3">Custom S3 Bucket</Typography>
        <Typography>
          To have Cord upload message attachments and annotation screenshots to
          your own S3 bucket, please provide the bucket name, region, as well as
          an access key ID and secret for an IAM User with read + write + list
          permissions to that bucket. For more information please refer to the{' '}
          <Link
            href={`${DOCS_ORIGIN}/customization/s3-bucket`}
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </Link>
          .
        </Typography>
        {!enableCustomS3Bucket ? (
          <Typography>
            Contact{' '}
            <Link href="mailto:partner-support@cord.com">
              partner-support@cord.com
            </Link>{' '}
            to enable this premium security feature.
          </Typography>
        ) : (
          <CustomizeS3Bucket
            bucket={application!.customS3Bucket}
            refetchApplication={refetchApplication}
          />
        )}
      </Box>
    </div>
  );
}
