import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Link, Stack, TextField, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';
import { UnsavedChangesBanner } from 'external/src/entrypoints/console/components/UnsavedChangesBanner.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';

const useStyles = createUseStyles({
  form: {
    marginBlockStart: 40,
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.XLARGE,
  },
  container: { gap: 0 },
});

export default function ApplicationRedirectURIs() {
  const classes = useStyles();

  const { application, refetch, id } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [updateApplication] = useUpdateApplicationForConsoleMutation();

  const [redirectURI, setRedirectURI] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if ((application?.redirectURI ?? '') !== redirectURI) {
      return true;
    }
    return false;
  }, [application?.redirectURI, redirectURI]);

  const onSave = useCallback(async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await updateApplication({
        variables: {
          id: id!,
          customEmailTemplate: undefined,
          enableEmailNotifications: undefined,
          name: undefined,
          customLinks: undefined,
          segmentWriteKey: undefined,
          iconURL: undefined,
          customNUX: undefined,
          redirectURI,
          eventWebhookURL: undefined,
          eventWebhookSubscriptions: undefined,
        },
      });

      if (result.data?.updateApplication.success === false) {
        throw new Error();
      } else if (
        !result.errors &&
        result.data?.updateApplication.success === true
      ) {
        setSuccessMessage('Changes saved successfully.');
        void refetch();
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(
          error?.message ??
            'An unexpected error has occurred. Please try again.',
        );
      }
    }
  }, [id, updateApplication, redirectURI, refetch]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
    },
    [onSave],
  );

  useEffect(() => {
    if (application) {
      setRedirectURI(application.redirectURI ?? '');
    }
  }, [application]);

  return (
    <Stack gap={Sizes.XLARGE / SPACING_BASE}>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box className={classes.container}>
        <Typography variant="body1" fontWeight="bold">
          Redirect URIs
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1 }}
          color={Colors.CONTENT_PRIMARY}
        >
          Cord can send a Slack or email notification whenever a user is
          mentioned or when a thread is shared. By default, this notification
          contains a link to the page where the conversation happened. You have
          the option to redirect users to a custom URL instead. For more
          information refer to our{' '}
          <Link
            href={`${DOCS_ORIGIN}/customization/redirect-link`}
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </Link>
          .
        </Typography>
        <form onSubmit={onSubmit} className={classes.form}>
          <BoxRow
            label="Redirect URI"
            tooltip="Users will be redirected here when they click on the CTAs in any shared threads, or mentions"
          >
            <Stack gap={1}>
              <TextField
                sx={{ width: '100%' }}
                type="url"
                value={redirectURI}
                placeholder="https://cord.com"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRedirectURI(e.target.value)
                }
              />
              <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
                To test, input https://api.cord.com/debug/redirect-uri and save
                the changes. Then @mention yourself in a Cord message, and click
                on the link you receive in a notification.
              </Typography>
            </Stack>
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
      </Box>
    </Stack>
  );
}
