import { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Link, Button, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import cx from 'classnames';

import { Colors } from 'common/const/Colors.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleAuthContext } from 'external/src/entrypoints/console/contexts/ConsoleAuthContextProvider.tsx';
import {
  useApplicationsQuery,
  useConsoleCordSessionTokenQuery,
  useConsoleUsersQuery,
  useRedirectToStripeCustomerPortalMutation,
  useStartCheckoutMutation,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { ADDONS, PRO_PRODUCT_ID } from 'common/const/Billing.ts';
import Box from 'external/src/entrypoints/console/ui/Box.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { BillingProgress } from 'external/src/entrypoints/console/components/BillingProgress.tsx';
import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';
import type { Addon } from 'external/src/entrypoints/console/hooks/usePlan.tsx';
import { usePlan } from 'external/src/entrypoints/console/hooks/usePlan.tsx';
import { usePricingPageURL } from 'external/src/entrypoints/console/hooks/usePricingPageURL.tsx';
import { MAUProgress } from 'external/src/entrypoints/console/components/MAUProgress.tsx';

const useStyles = createUseStyles({
  boxHeader: {
    marginBlockEnd: Sizes.LARGE,
  },
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.MEDIUM,
    width: '100%',
  },
  ctaRightSide: {
    marginBlockStart: Sizes.MEDIUM,
  },
  planConfigDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginBlockEnd: Sizes.LARGE,
  },
  helpIcon: {
    display: 'inline',
  },
  addonIcon: { height: 20, width: 20, color: Colors.GREY },
  addonEnabled: {
    color: Colors.GREEN,
    strokeWidth: 2,
  },
  addonRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});

export function Billing() {
  const { connected } = useContextThrowingIfNoProvider(ConsoleAuthContext);
  const { data } = useConsoleCordSessionTokenQuery({ skip: !connected });

  const isBillingInConsoleEnabled = useFeatureFlag(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
  );
  const navigate = useNavigate();
  if (!isBillingInConsoleEnabled) {
    navigate('/', { replace: true });
  }

  return (
    <>
      <Helmet>
        <title>Billing</title>
      </Helmet>
      <div>
        {data?.consoleCordSessionToken ? (
          <>
            <CurrentPlan />
          </>
        ) : (
          'Loading...'
        )}
      </div>
    </>
  );
}

function CurrentPlan() {
  const classes = useStyles();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const closeToast = useCallback(() => setToastMessage(null), []);

  const { data: applicationsData, loading: applicationsLoading } =
    useApplicationsQuery();
  const { data: seatsData, loading: seatsLoading } = useConsoleUsersQuery();

  const pricingPageURL = usePricingPageURL();

  const planDetails = usePlan();
  if (!planDetails) {
    return null;
  }
  const {
    planName,
    isPaymentPending,
    planConfig,
    billingType,
    renewalDate,
    addons,
    planDescription,
  } = planDetails;
  const numApplications = applicationsData?.applications.length ?? undefined;
  const numSeats = seatsData?.customerConsoleUsers.length ?? undefined;

  const formattedRenewalDate =
    planName !== 'Starter' &&
    renewalDate &&
    new Date(renewalDate).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <>
      <Box>
        <section className={classes.boxHeader}>
          <Typography fontWeight={Sizes.BOLD_TEXT_WEIGHT}>
            Your Billing Details
          </Typography>
          <Typography variant="body2" mt={8 / SPACING_BASE}>
            Details relating to your plan
          </Typography>
        </section>
        <section>
          <Typography variant="body1" fontWeight="bold">
            {`${planName} plan${isPaymentPending ? ' (Payment due)' : ''}`}
          </Typography>
          {formattedRenewalDate && (
            <Typography variant="body2">
              Renewal date:{' '}
              <Typography
                fontWeight={Sizes.BOLD_TEXT_WEIGHT}
                variant="body2"
                component="span"
              >
                {formattedRenewalDate}
              </Typography>
            </Typography>
          )}
        </section>
        <div className={classes.wrapper}>
          <div>
            <div className={classes.planConfigDetails}>
              {planConfig.mau !== undefined ? (
                <Typography variant="body2" className={classes.addonRow}>
                  <CheckCircleIcon
                    className={cx([classes.addonIcon, classes.addonEnabled])}
                  />
                  MAU:{' '}
                  <Typography
                    fontWeight={Sizes.BOLD_TEXT_WEIGHT}
                    variant="body2"
                    component="span"
                  >
                    {planConfig.mau}
                  </Typography>
                  <HelpIconWithTooltip
                    tooltipName="mau-description"
                    tooltipContent="Number of users who were actively using Cord across the last month within your software."
                    className={classes.helpIcon}
                  />
                </Typography>
              ) : null}
              <Typography variant="body2" className={classes.addonRow}>
                <CheckCircleIcon
                  className={cx([classes.addonIcon, classes.addonEnabled])}
                />
                Seats:{' '}
                <Typography
                  fontWeight={Sizes.BOLD_TEXT_WEIGHT}
                  variant="body2"
                  component="span"
                >
                  {planConfig.seats}
                </Typography>
                <HelpIconWithTooltip
                  tooltipName="seats-description"
                  tooltipContent="Each individual user account with access to the console."
                  className={classes.helpIcon}
                />
              </Typography>
              <Typography variant="body2" className={classes.addonRow}>
                <CheckCircleIcon
                  className={cx([classes.addonIcon, classes.addonEnabled])}
                />
                Projects:{' '}
                <Typography
                  fontWeight={Sizes.BOLD_TEXT_WEIGHT}
                  variant="body2"
                  component="span"
                >
                  {planConfig.applications}
                </Typography>
                <HelpIconWithTooltip
                  tooltipName="applications-description"
                  tooltipContent="A dedicated space for collaboration, equipped with unique settings and API key, ideal for different development stages like 'staging' or 'production'."
                  className={classes.helpIcon}
                />
              </Typography>
              <Addons addons={addons} />
              {planDescription.length > 0 ? (
                <>
                  {planDescription.map((line, idx) => (
                    <Typography
                      variant="body2"
                      key={`plandescription-${idx}`}
                      className={classes.addonRow}
                    >
                      <CheckCircleIcon
                        className={cx([
                          classes.addonIcon,
                          classes.addonEnabled,
                        ])}
                      />
                      {line}
                    </Typography>
                  ))}
                </>
              ) : null}
            </div>
            <Typography marginBottom={Sizes.SMALL / SPACING_BASE}>
              Need different plan options?{' '}
              <Link
                href={`${pricingPageURL}?utm_source=console&utm_medium=more_options_link`}
                target="_blank"
              >
                View plans
              </Link>
            </Typography>
            <Typography>
              Need any help? Please{' '}
              <Link href="mailto:support@cord.com">write to us</Link>.
            </Typography>
          </div>
          <div className={classes.progressContainer}>
            <MAUProgress maxValue={planConfig.mau} />
            <BillingProgress
              name="seats"
              currentValue={numSeats}
              maxValue={planConfig.seats}
              isLoading={seatsLoading}
            />
            <BillingProgress
              name="projects"
              currentValue={numApplications}
              maxValue={planConfig.applications}
              isLoading={applicationsLoading}
            />

            <div className={classes.ctaRightSide}>
              {planName === 'Starter' ? (
                <UpgradeButton onError={setToastMessage} />
              ) : billingType === 'stripe' ? (
                <StripePlanDetailsButton onError={setToastMessage} />
              ) : null}
            </div>
          </div>
        </div>
      </Box>
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={closeToast}
      />
    </>
  );
}

function StripePlanDetailsButton({
  onError,
}: {
  onError: (error: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectToStripeCustomerPortal] =
    useRedirectToStripeCustomerPortalMutation();

  const onCustomerPortalClick = useCallback(() => {
    void (async () => {
      setIsLoading(true);
      const response = await redirectToStripeCustomerPortal();
      const result = response.data?.redirectToStripeCustomerPortal;

      if (!result) {
        onError('Unknown error. No result');
      } else if (result.success && result.redirectURL) {
        window.location.href = result.redirectURL!;
      } else if (result.failureDetails) {
        // TODO handle errors
        onError(result.failureDetails.code);
      } else {
        onError('Unknown error. No failure details');
      }
      setIsLoading(false);
    })();
  }, [redirectToStripeCustomerPortal, onError]);

  return (
    <Button
      id="customer-portal-button"
      onClick={onCustomerPortalClick}
      disabled={isLoading}
      variant="contained"
    >
      Manage plan
    </Button>
  );
}

function UpgradeButton({ onError }: { onError: (error: string) => void }) {
  const [startCheckout] = useStartCheckoutMutation();
  const [isLoading, setIsLoading] = useState(false);
  const onCheckout = useCallback(() => {
    const onCheckoutImpl = async () => {
      setIsLoading(true);
      const response = await startCheckout({
        variables: { productKey: PRO_PRODUCT_ID },
      });
      const result = response.data?.startCheckout;
      if (!result) {
        onError('Unknown error. No result');
      } else if (result.success && result.redirectURL) {
        window.location.href = result.redirectURL!;
      } else if (result.failureDetails) {
        // TODO handle errors
        onError(result.failureDetails.code);
      } else {
        onError('Unknown error. No failure details');
      }

      setIsLoading(false);
    };

    void onCheckoutImpl();
  }, [startCheckout, onError]);

  return (
    <Button
      id="checkout-and-portal-button"
      onClick={onCheckout}
      disabled={isLoading}
      variant="contained"
    >
      {isLoading ? 'Redirecting to upgrade...' : 'Upgrade now'}
    </Button>
  );
}

function Addons({ addons }: { addons: Addon[] }) {
  const classes = useStyles();

  return addons
    .filter((addon) => addon.value)
    .map((addon: Addon) => {
      const addonData = ADDONS.find((item) => item.name === addon.key);
      return (
        <Typography
          variant="body2"
          key={addon.key}
          className={classes.addonRow}
        >
          {addon.value ? (
            <CheckCircleIcon
              className={cx([classes.addonIcon, classes.addonEnabled])}
            />
          ) : (
            <XCircleIcon className={classes.addonIcon} />
          )}
          {addonData?.description}
        </Typography>
      );
    });
}
