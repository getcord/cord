import { useState, useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

import { useUpdateUserDetailsMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
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
  },
  label: { fontWeight: 500, margin: 0 },
  labelGroup: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
  },
  explainer: {
    gridColumnStart: '2',
    color: Colors.CONTENT_PRIMARY,
  },
});

export function SettingsUser() {
  const classes = useStyles();

  const { user, getAccessTokenSilently } = useAuth0();

  const isSocialsConnectedUser = useMemo(() => {
    // This shouldn't happen because it's a protected route
    if (!user?.sub) {
      return false;
    }

    const provider = user.sub.split('|')[0];

    return provider !== 'auth0';
  }, [user]);

  const [updateUserDetails] = useUpdateUserDetailsMutation();

  const [name, setName] = useState(user?.name ?? '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (name !== (user?.name ?? '')) {
      return true;
    }
    return false;
  }, [name, user?.name]);

  const onSave = useCallback(async () => {
    // 'sub' is the cryptic name for the auth0 user id
    if (!user?.sub) {
      // This shouldn't happen because this is a protected route
      setErrorMessage('An unexpected error has occurred. Please try again.');
      return;
    }

    const result = await updateUserDetails({
      variables: {
        id: user.sub,
        name,
      },
    });

    if (result.data?.updateUserDetails.success === false) {
      setErrorMessage(
        result.data?.updateUserDetails?.failureDetails?.message ??
          'An unexpected error has occurred. Please try again.',
      );
    } else if (
      !result.errors &&
      result.data?.updateUserDetails.success === true
    ) {
      setSuccessMessage('Changes saved successfully.');
      // Refetch the Auth0 user so updated name is reflected around the console
      void getAccessTokenSilently({ ignoreCache: true });
    }
    return false;
  }, [getAccessTokenSilently, name, updateUserDetails, user]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
    },
    [onSave],
  );
  return (
    <Stack>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Your User Details
            </Typography>
            <Typography variant="body2" mt={8 / SPACING_BASE}>
              Details relating to your Cord Console user
            </Typography>
          </section>

          <form onSubmit={onSubmit} style={{ display: 'contents' }}>
            <section className={classes.row}>
              <section className={classes.labelGroup}>
                <label className={classes.label}>Email</label>
                <HelpIconWithTooltip
                  tooltipName="user-email"
                  tooltipContent="Please contact partner&#8209;support@cord.com if you need to change the email associated with your Console account"
                />
              </section>
              <TextField type="text" required disabled value={user?.email} />
            </section>
            <section className={classes.row}>
              <section className={classes.labelGroup}>
                <label className={classes.label}>Name</label>
                {isSocialsConnectedUser && (
                  <HelpIconWithTooltip
                    tooltipName="user-name"
                    tooltipContent="If you connected to the Cord Console with a socials account like Google or Github, you will have to change your name in those tools."
                  />
                )}
              </section>
              <TextField
                type="text"
                required
                value={name}
                disabled={isSocialsConnectedUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </section>
            <section className={classes.row}>
              <div className="empty-cell"></div>
              <div style={{ display: 'flex' }}>
                <Button
                  type={'submit'}
                  variant="contained"
                  sx={{ width: 'fit-content' }}
                  disabled={isSocialsConnectedUser || !isDirty}
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
            </section>
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
    </Stack>
  );
}
