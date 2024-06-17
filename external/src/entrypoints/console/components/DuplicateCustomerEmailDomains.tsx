import { useCallback, useEffect, useState } from 'react';
import type { User } from '@auth0/auth0-react';
import { createUseStyles } from 'react-jss';
import { Button, Typography } from '@mui/material';
import { useRequestAccessToCustomerMutation } from 'external/src/entrypoints/console/graphql/operations.ts';

import { Toast } from 'external/src/entrypoints/console/ui/Toast.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { Colors } from 'common/const/Colors.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

const useStyles = createUseStyles({
  buttonGroup: {
    alignItems: 'center',
    display: 'flex',
    gap: 16,
    marginTop: 16,
  },
  contactButton: {
    backgroundColor: Colors.BRAND_PURPLE_DARK,
    borderRadius: 4,
    color: Colors.WHITE,
    padding: '8px 16px',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: Colors.BRAND_PURPLE_DARKER,
      color: Colors.WHITE,
      textDecoration: 'none',
    },
  },
});

type DuplicationCustomerEmailDomainsProps = {
  customerIDs?: string[] | null;
  user?: User;
  createNewCustomer: () => void;
  customerName?: string | null;
};

/**
 * Shows up when a console user signs up with an email domain (let's say @cord.com)
 * that is not a common one (such as gmail) and we also detect that there are other
 * console users in other customer entities with the same email domain
 */
export function DuplicationCustomerEmailDomains({
  customerIDs,
  user,
  createNewCustomer,
  customerName,
}: DuplicationCustomerEmailDomainsProps) {
  const classes = useStyles();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestAccessToCustomer] = useRequestAccessToCustomerMutation();
  const [pageType, setPageType] = useState<
    | 'single-existing-customer'
    | 'multiple-existing-customers'
    | 'pending-request'
  >();
  const { refetch: refetchCustomerInfo, pendingCustomerID } =
    useContextThrowingIfNoProvider(CustomerInfoContext);

  const { logEvent } = useLogger();

  const requestAccessToExistingCustomer = useCallback(() => {
    if (!customerIDs) {
      return;
    }

    if (customerIDs.length !== 1) {
      // There should only be one customerID in the array
      setErrorMessage('Something went wrong');
      return;
    }

    const customerID = customerIDs[0];

    logEvent('console-customer-request-access-existing-customer', {
      email: user?.email,
      customerID,
    });

    void requestAccessToCustomer({
      variables: { customerID },
    }).then((response) => {
      if (response.data?.requestAccessToCustomer.success) {
        refetchCustomerInfo?.();
      } else {
        setErrorMessage('Something went wrong when requesting access');
      }
      refetchCustomerInfo?.();
    });
  }, [
    customerIDs,
    logEvent,
    refetchCustomerInfo,
    requestAccessToCustomer,
    user?.email,
  ]);

  useEffect(() => {
    if (pendingCustomerID) {
      logEvent('console-user-pending-request-page-load', {
        email: user?.email,
        pendingCustomerID,
      });
      setPageType('pending-request');
    }
    if (customerIDs && customerIDs.length === 1) {
      logEvent('console-single-existing-customer-page-load', {
        email: user?.email,
        customerID: customerIDs[0],
      });
      setPageType('single-existing-customer');
    } else {
      logEvent('console-multiple-existing-customers-page-load', {
        email: user?.email,
      });
      setPageType('multiple-existing-customers');
    }
  }, [customerIDs, logEvent, pendingCustomerID, user?.email]);

  const createNewCustomerWithLog = useCallback(() => {
    logEvent('console-create-new-customer-button-click', {
      email: user?.email,
      pageType,
    });
    createNewCustomer();
  }, [createNewCustomer, logEvent, pageType, user?.email]);

  // When a user has already requested access to an existing customer
  if (pendingCustomerID) {
    return (
      <div>
        <Typography variant="body1">
          {`We sent an email to the members of ${customerName} with a request to add you to the account. You will be emailed once the request is approved or denied.`}
        </Typography>
        <Typography variant="body1">
          If you would like to to resend the request, please contact{' '}
          <a href="mailto:support@cord.com">support@cord.com</a>.
        </Typography>
        <Typography>
          In the meantime, learn more about how to start integrating Cord and
          see what you can build.
        </Typography>
        <div className={classes.buttonGroup}>
          <a
            href={`${DOCS_ORIGIN}/get-started/demo-apps`}
            className={classes.contactButton}
          >
            Check out our demo apps
          </a>
          <Button type="button" onClick={createNewCustomerWithLog}>
            {`Don't join ${
              customerName ?? 'this team'
            }, create a new team account`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {customerIDs && customerIDs.length === 1 ? (
        <>
          <Typography variant="body1">
            {`We didn't create your team because someone else ${
              user
                ? 'from ' + user?.email?.split('@')[1]
                : 'with a matching email domain'
            } already created it.`}
          </Typography>
          <Typography>{`To send a request to join ${
            customerName ?? 'this team'
          } click “Request access to ${
            customerName ?? 'this team'
          }”.`}</Typography>
          <div className={classes.buttonGroup}>
            <Button
              type="button"
              onClick={requestAccessToExistingCustomer}
              variant="contained"
            >
              {`Request access to ${customerName ?? 'this team'}`}
            </Button>
            <Button type="button" onClick={createNewCustomerWithLog}>
              Create a new team account
            </Button>
          </div>
        </>
      ) : (
        <>
          <Typography variant="body1">
            We didn&apos;t create your team because there are several existing
            teams from{' '}
            {user ? user?.email?.split('@')[1] : 'a matching email domain'}.
            Please contact your team members with access to ask them to add your
            e-mail to their team account.
          </Typography>
          <Typography variant="body1">
            Alternatively, you can email us at{' '}
            <a href="mailto:support@cord.com">support@cord.com</a> if you would
            like to request access to these accounts.
          </Typography>

          <div className={classes.buttonGroup}>
            <a href="mailto:support@cord.com" className={classes.contactButton}>
              Contact Cord
            </a>
            <Button type="button" onClick={createNewCustomerWithLog}>
              Create a new team account
            </Button>
          </div>
        </>
      )}
      <Toast
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
        isOpen={Boolean(errorMessage)}
        button={
          errorMessage ? (
            <a href="mailto:support@cord.com">Contact Cord</a>
          ) : undefined
        }
      />
    </div>
  );
}
