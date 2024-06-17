import { useState, useCallback, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import SecretBox from 'external/src/entrypoints/console/components/SecretBox.tsx';
import { BoxRow } from 'external/src/entrypoints/console/components/BoxRow.tsx';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

import { useUpdateCustomerNameMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { UnsavedChangesBanner } from 'external/src/entrypoints/console/components/UnsavedChangesBanner.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';

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

export function SettingsCustomer() {
  const classes = useStyles();
  const { customerID, sharedSecret, customerName, billingInfo, refetch } =
    useContextThrowingIfNoProvider(CustomerInfoContext);
  const [name, setName] = useState(customerName ?? '');
  const [updateName] = useUpdateCustomerNameMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (customerName !== name) {
      return true;
    }
    return false;
  }, [customerName, name]);

  const isBillingInConsoleEnabled = useFeatureFlag(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
  );

  const onSave = useCallback(async () => {
    const result = await updateName({
      variables: {
        name,
      },
    });

    if (result.data?.updateCustomerName.success === false) {
      setErrorMessage(
        result.data?.updateCustomerName?.failureDetails?.message ??
          'An unexpected error has occurred. Please try again.',
      );
    } else if (
      !result.errors &&
      result.data?.updateCustomerName.success === true
    ) {
      setSuccessMessage('Changes saved successfully.');
      void refetch?.();
    }
    return false;
  }, [name, refetch, updateName]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      await onSave();
    },
    [onSave],
  );
  return (
    <Stack gap={Sizes.XLARGE / SPACING_BASE}>
      {isDirty && <UnsavedChangesBanner onSave={onSave} />}
      <Box>
        <div className={classes.boxContent}>
          <section className={classes.boxHeader}>
            <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
              Your Group Account Details
            </Typography>
            <Typography variant="body2" mt={8 / SPACING_BASE}>
              Details relating to your Cord account
            </Typography>
          </section>

          <form onSubmit={onSubmit} style={{ display: 'contents' }}>
            <section className={classes.row}>
              <section className={classes.labelGroup}>
                <label className={classes.label}>Name</label>
              </section>
              <TextField
                type="text"
                required
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
              <Typography
                className={classes.explainer}
                variant="body2"
                mt={8 / SPACING_BASE}
              >
                Your group&apos;s name. This is just for your account
                administration and is not visible to any end users in Cord
                components.
              </Typography>
            </section>
            <section className={classes.row}>
              <div className="empty-cell"></div>
              <div style={{ display: 'flex' }}>
                <Button
                  type={'submit'}
                  variant="contained"
                  sx={{ width: 'fit-content' }}
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
      {isBillingInConsoleEnabled === false ||
      billingInfo.pricingTier !== 'free' ? (
        <Box>
          <div className={classes.boxContent}>
            <section className={classes.boxHeader}>
              <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
                Your Account API keys
              </Typography>
              <Typography variant="body2" mt={8 / SPACING_BASE}>
                API keys that will allow you to programatically manage your
                projects
              </Typography>
            </section>
            {customerID && (
              <BoxRow
                label="Customer ID"
                tooltip="Use this when managing your account through the Cord API"
              >
                <SecretBox text={customerID} canBeCopiedToClipboard />
              </BoxRow>
            )}
            {sharedSecret && (
              <BoxRow
                label="Customer Secret"
                tooltip="Use this when managing your account through the Cord API"
              >
                <SecretBox
                  text={sharedSecret}
                  canBeCopiedToClipboard
                  hiddenOnRender
                />
              </BoxRow>
            )}
          </div>
        </Box>
      ) : null}
    </Stack>
  );
}
