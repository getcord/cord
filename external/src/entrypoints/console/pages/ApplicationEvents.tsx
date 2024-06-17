import { useCallback, useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import {
  Typography,
  Button,
  TextField,
  Checkbox,
  Divider,
  CircularProgress,
  Link,
  Stack,
} from '@mui/material';

import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';
import { Colors } from 'common/const/Colors.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { UnsavedChangesBanner } from 'external/src/entrypoints/console/components/UnsavedChangesBanner.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';

const NOTIFICATION_CREATED = 'notification-created';
const THREAD_MESSAGE_ADDED = 'thread-message-added';

const useStyles = createUseStyles({
  container: { display: 'flex', flexDirection: 'column', gap: Sizes.XLARGE },
  header: {
    marginBlockEnd: Sizes.LARGE,
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.MEDIUM,
  },
  form: { display: 'contents', width: '100%' },
  settingsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.XLARGE,
  },
  submitButton: {
    display: 'flex',
    flexDirection: 'row',
    gap: Sizes.MEDIUM,
  },
});

export function ApplicationEvents() {
  const classes = useStyles();

  const { application, refetch } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [url, setURL] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  const [updateApplication] = useUpdateApplicationForConsoleMutation();

  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    if (
      !isEqual(application?.eventWebhookSubscriptions ?? [], subscriptions) ||
      (application?.eventWebhookURL ?? '') !== (url ?? '')
    ) {
      return true;
    }
    return false;
  }, [
    application?.eventWebhookSubscriptions,
    subscriptions,
    application?.eventWebhookURL,
    url,
  ]);

  useEffect(() => {
    if (application) {
      const { eventWebhookURL, eventWebhookSubscriptions } = application;
      if (eventWebhookURL) {
        setURL(eventWebhookURL);
      }
      if (eventWebhookSubscriptions) {
        setSubscriptions(eventWebhookSubscriptions);
      }
    }
  }, [application]);

  const onURLChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setURL(e.target.value);
    setErrorMessage(null);
    setSuccessMessage(null);
    setWarningMessage(null);
  }, []);

  const handleSubsCheckbox = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.id;
      setErrorMessage(null);
      setSuccessMessage(null);
      setWarningMessage(null);
      setSubscriptions((prevSubscriptions) => {
        if (e.target.checked && !prevSubscriptions.includes(name)) {
          return [...prevSubscriptions, name];
        } else if (!e.target.checked && prevSubscriptions.includes(name)) {
          return prevSubscriptions.filter((sub) => sub !== name);
        }
        return prevSubscriptions;
      });
    },
    [],
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    const appID = application?.id;
    const result = await updateApplication({
      variables: {
        id: appID!,
        eventWebhookURL: url,
        eventWebhookSubscriptions: subscriptions,
        customNUX: undefined,
        customEmailTemplate: undefined,
        enableEmailNotifications: undefined,
        name: undefined,
        customLinks: undefined,
        segmentWriteKey: undefined,
        iconURL: undefined,
        redirectURI: undefined,
      },
    });
    if (result.data?.updateApplication.success === false) {
      setSaving(false);
      if (result.data.updateApplication.failureDetails?.message) {
        setErrorMessage(
          `Changes not saved. ${result.data.updateApplication.failureDetails.message}`,
        );
      } else {
        setErrorMessage('An unexpected error has occurred. Please try again.');
      }
    }
    if (!result.errors && result.data?.updateApplication.success === true) {
      setSaving(false);
      if (url) {
        if (url !== application?.eventWebhookURL) {
          setSuccessMessage(
            `Changes saved successfully. URL verification successful: events webhook will be sent to '${url}'`,
          );
        } else {
          setSuccessMessage('Changes saved successfully.');
        }
      }
      if (!url) {
        setSuccessMessage('Changes saved successfully.');
        setWarningMessage('You will not receive events without a valid URL.');
      }
      void refetch();
    }
    window.scrollTo(0, document.body.scrollHeight);
  }, [
    application?.eventWebhookURL,
    application?.id,
    refetch,
    subscriptions,
    updateApplication,
    url,
  ]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
    },
    [onSave],
  );

  if (!application) {
    return <SpinnerCover />;
  }

  return (
    <Stack gap={Sizes.XLARGE / SPACING_BASE}>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box className={classes.container}>
        <div className={classes.header}>
          <Typography variant="h3">Events Webhook URL</Typography>
          <Typography variant="body2" color={Colors.CONTENT_PRIMARY}>
            Subscribe to events that happen in this Cord project. For more
            information, refer to our{' '}
            <Link
              href={`https://docs.cord.com/reference/events-webhook`}
              target="_blank"
              rel="noreferrer"
            >
              API Docs
            </Link>
            .
          </Typography>
        </div>
        <form onSubmit={onSubmit} className={classes.form}>
          <BoxRow label="Webhook URL">
            <TextField
              type="url"
              value={url ?? ''}
              onChange={onURLChange}
              placeholder="https://cord.com"
              fullWidth
            />
            <Typography
              variant="body2"
              sx={{ marginBlockStart: Sizes.MEDIUM / SPACING_BASE }}
              color={Colors.CONTENT_PRIMARY}
            >
              Enter a URL you would like Cord events to be sent to for this
              project. When you hit save below a POST request will be sent to
              the URL to check it is valid. The endpoint must return a 200 code
              to be successfully accepted.
            </Typography>
          </BoxRow>
          <BoxRow label="Event subscriptions">
            <div className={classes.settings}>
              <Typography variant="body1" fontWeight={500}>
                Notifications
              </Typography>
              <section className={classes.settingsRow}>
                <Checkbox
                  checked={subscriptions.includes(NOTIFICATION_CREATED)}
                  onChange={handleSubsCheckbox}
                  id={NOTIFICATION_CREATED}
                  sx={{ marginTop: -1 }}
                />
                <label htmlFor={NOTIFICATION_CREATED}>
                  <Typography variant="body1" fontWeight={500}>
                    {NOTIFICATION_CREATED}
                  </Typography>
                  <Typography variant="body2" color={Colors.CONTENT_SECONDARY}>
                    A notification was sent
                  </Typography>
                </label>
              </section>
              <Divider />
              <Typography variant="body1" fontWeight={500}>
                Messages
              </Typography>
              <section className={classes.settingsRow}>
                <Checkbox
                  checked={subscriptions.includes(THREAD_MESSAGE_ADDED)}
                  onChange={handleSubsCheckbox}
                  id={THREAD_MESSAGE_ADDED}
                  sx={{ marginTop: -1 }}
                />
                <label htmlFor={THREAD_MESSAGE_ADDED}>
                  <Typography variant="body1" fontWeight={500}>
                    {THREAD_MESSAGE_ADDED}
                  </Typography>
                  <Typography variant="body2" color={Colors.CONTENT_SECONDARY}>
                    A message was sent
                  </Typography>
                </label>
              </section>
            </div>
          </BoxRow>
          <BoxRow label="">
            {saving ? (
              <Button
                variant="contained"
                disabled
                className={classes.submitButton}
              >
                <CircularProgress size="16px" />
                Saving...
              </Button>
            ) : (
              <div style={{ display: 'flex' }}>
                <Button
                  type={'submit'}
                  variant="contained"
                  className={classes.submitButton}
                  disabled={!isDirty}
                >
                  Save{' '}
                </Button>
                {!isDirty && (
                  <HelpIconWithTooltip
                    tooltipName="disabled save"
                    tooltipContent="You have no changes"
                  />
                )}
              </div>
            )}
            <SubmitFormResultMessage
              errorMessage={errorMessage}
              clearErrorMessage={() => setErrorMessage(null)}
              successMessage={successMessage}
              clearSuccessMessage={() => setSuccessMessage(null)}
              warningMessage={warningMessage}
              clearWarningMessage={() => setWarningMessage(null)}
            />
          </BoxRow>
        </form>
      </Box>
    </Stack>
  );
}
