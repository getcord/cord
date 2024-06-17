import { useCallback, useState, useEffect, useMemo } from 'react';

import {
  Button,
  InputLabel,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import { createUseStyles } from 'react-jss';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Colors } from 'common/const/Colors.ts';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { useImageField } from 'external/src/entrypoints/console/hooks/useImageField.tsx';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import SecretBox from 'external/src/entrypoints/console/components/SecretBox.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { ConfigurationClientAuthToken } from 'external/src/entrypoints/console/components/ClientAuthToken.tsx';
import { DeletionConfirmationModal } from 'external/src/entrypoints/console/components/DeletionConfirmationModal.tsx';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { UnsavedChangesBanner } from 'external/src/entrypoints/console/components/UnsavedChangesBanner.tsx';

const useStyles = createUseStyles({
  boxContent: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: Sizes.XLARGE,
  },
  boxHeader: {
    marginBlockEnd: Sizes.LARGE,
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.MEDIUM,
  },
  boxAction: {
    marginBlockEnd: Sizes.LARGE,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: Sizes.MEDIUM,
  },
});

export default function ApplicationGeneral() {
  const [showDeleteApplicationModal, setShowDeleteApplicationModal] =
    useState<boolean>(false);
  const classes = useStyles();
  const [secretInput, setSecretInput] = useState<string>('');
  const [errorDeleting, setErrorDeleting] = useState<string>('');
  const navigate = useNavigate();

  const {
    id,
    application,
    refetch,
    jwt: serverJWT,
  } = useContextThrowingIfNoProvider(ConsoleApplicationContext);

  const [updateApplication] = useUpdateApplicationForConsoleMutation();
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const {
    imageURL,
    setInitialImageURLRef,
    uploadImageFile,
    imageFieldElement,
    imageFile,
  } = useImageField({
    imageWidth: 56,
    imageHeight: 56,
    newDesign: true,
    placeholder: 'Your logo URL',
  });

  const isDirty = useMemo(() => {
    if (
      application?.name !== name ||
      application?.iconURL !== imageURL ||
      imageFile
    ) {
      return true;
    }
    return false;
  }, [application?.name, application?.iconURL, name, imageURL, imageFile]);

  const onSave = useCallback(async () => {
    const uploadedIconURL = await uploadImageFile(application!.id, 'icon');

    const result = await updateApplication({
      variables: {
        id: application!.id,
        iconURL: uploadedIconURL ?? imageURL,
        name: name || undefined,
        customEmailTemplate: undefined,
        enableEmailNotifications: undefined,
        customLinks: undefined,
        customNUX: undefined,
        segmentWriteKey: undefined,
        redirectURI: undefined,
        eventWebhookURL: undefined,
        eventWebhookSubscriptions: undefined,
      },
    });

    if (result.data?.updateApplication.success === false) {
      setErrorMessage('An unexpected error has occurred. Please try again.');
    } else if (
      !result.errors &&
      result.data?.updateApplication.success === true
    ) {
      setSuccessMessage('Changes saved successfully.');
      void refetch();
    }
  }, [
    application,
    imageURL,
    name,
    refetch,
    updateApplication,
    uploadImageFile,
  ]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
      return false;
    },
    [onSave],
  );

  const onDeleteConfirmation = useCallback(
    async (secret: string | undefined) => {
      if (!secret || !application || secret !== application.sharedSecret) {
        return setErrorDeleting(
          'Please provide the correct project secret and try again.',
        );
      } else {
        const response = await fetch(
          `${API_ORIGIN}/v1/projects/${application.id}`,
          {
            method: 'DELETE',
            body: JSON.stringify({
              secret,
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${application.customerAccessToken}`,
              'X-Cord-Source': 'console',
            },
          },
        );

        if (response.ok) {
          setShowDeleteApplicationModal(false);
          navigate(ConsoleRoutes.PROJECTS);
        } else {
          setErrorDeleting(
            'There was an error deleting the project. Please try again.',
          );
          console.error(response.text());
        }
      }

      setErrorDeleting('');
      setSecretInput('');
    },
    [application, navigate],
  );

  useEffect(() => {
    setInitialImageURLRef.current(application?.iconURL ?? null);
    setName(application?.name ?? '');
  }, [application?.iconURL, application?.name, setInitialImageURLRef]);

  if (application === null) {
    navigate(ConsoleRoutes.PROJECTS);
    return;
  }

  return (
    <Stack gap={Sizes.XLARGE / SPACING_BASE}>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Name and icon
            </Typography>
            <Typography variant="body2" mt={8 / SPACING_BASE}>
              These will be used in email notifications if none is specified in
              the{' '}
              <Link
                href={`/projects/${application.id}/settings/email-notifications`}
              >
                Email notifications settings
              </Link>
              , and when integrating Slack.
            </Typography>
          </section>

          <form onSubmit={onSubmit} style={{ display: 'contents' }}>
            <BoxRow
              label="Name"
              tooltip="Your product’s name, eg “AwesomeSaaS” or
                      “AwesomeSaaS [Staging]”. Used as the name of
                      your product in notifications from Cord. Can be
                      renamed later."
            >
              <TextField
                type="text"
                required
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                fullWidth
              />
            </BoxRow>
            <BoxRow
              label="Icon"
              tooltip="URL for your icon or upload an image. Square 
                      image, 256x256. Will be used as the avatar for messages 
                      coming from your app."
            >
              {imageFieldElement}
            </BoxRow>
            <BoxRow>
              <div style={{ display: 'flex' }}>
                <Button type={'submit'} variant="contained" disabled={!isDirty}>
                  Save{' '}
                </Button>
                {!isDirty && (
                  <HelpIconWithTooltip
                    tooltipName="disabled save"
                    tooltipContent="You have no changes"
                  />
                )}
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
        </div>
      </Box>
      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              API keys
            </Typography>
          </section>
          <BoxRow
            label="Project ID"
            tooltip="Use this when calling the Cord API"
          >
            <SecretBox text={application.id} canBeCopiedToClipboard />
          </BoxRow>
          <BoxRow label="Secret" tooltip="Use this when calling the Cord API">
            <SecretBox
              text={application.sharedSecret}
              canBeCopiedToClipboard
              hiddenOnRender
            />
          </BoxRow>
        </div>
      </Box>
      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Server auth token
            </Typography>
            <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
              Use this when calling the Cord REST API. Valid for 2 hours. To get
              a new one, refresh the page.
            </Typography>
          </section>
          <BoxRow label="Server auth token">
            {serverJWT ? (
              <SecretBox
                text={serverJWT}
                canBeCopiedToClipboard
                hiddenOnRender
              />
            ) : (
              'Loading'
            )}
          </BoxRow>
        </div>
      </Box>

      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Client auth token
            </Typography>
            <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
              A client auth token is used to identify a specific user. Enter
              your details below to generate your token. Valid for 2 hours. To
              get a new one, refresh the page.
            </Typography>
            <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
              You can create a user in the{' '}
              <Link to={`/projects/${id}/users`} component={RouterLink}>
                Users
              </Link>{' '}
              section, to add the user to a group refer to our{' '}
              <Link to={`/projects/${id}/groups`} component={RouterLink}>
                Groups
              </Link>{' '}
              section.
            </Typography>
          </section>
          <ConfigurationClientAuthToken />
        </div>
      </Box>

      <Box type={'alert'}>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Delete Project
            </Typography>
            <Typography variant="body2" mt={8 / SPACING_BASE}>
              This will permanently delete the project along with any groups,
              users, threads and messages associated with that project.
            </Typography>
            <Typography variant="body2">
              <strong>This action is not reversible </strong>— please continue
              with caution.
            </Typography>
          </section>

          <section className={classes.boxAction}>
            <Button
              type={'button'}
              variant={'alert'}
              onClick={() => setShowDeleteApplicationModal(true)}
            >
              Delete
            </Button>
            <DeletionConfirmationModal
              header={`Delete Project "${application.name}"?`}
              body={
                <>
                  <p>
                    Deleting this project will delete the project{' '}
                    <strong>permanently</strong>, including all groups, users,
                    threads and messages associated with it.
                  </p>
                  <p>
                    To confirm, type the project secret below and press Delete.
                  </p>

                  <InputLabel size="small">Project secret</InputLabel>
                  <TextField
                    id="application-secret"
                    value={secretInput}
                    variant="outlined"
                    placeholder={'project-secret'}
                    onChange={(e) => {
                      setSecretInput(e.target.value);
                    }}
                    fullWidth
                  />

                  {errorDeleting ? (
                    <Typography
                      variant="body2"
                      color="error"
                      mt={8 / SPACING_BASE}
                    >
                      <Stack direction="row" gap={1}>
                        <ExclamationCircleIcon height={20} />{' '}
                        <span>{errorDeleting}</span>
                      </Stack>
                    </Typography>
                  ) : null}
                </>
              }
              visible={showDeleteApplicationModal}
              onCancel={() => {
                setShowDeleteApplicationModal(false);
                setErrorDeleting('');
                setSecretInput('');
              }}
              onDelete={() => void onDeleteConfirmation(secretInput)}
            />
          </section>
        </div>
      </Box>
    </Stack>
  );
}
