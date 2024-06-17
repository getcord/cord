import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';
import { CountryDropdown } from 'react-country-region-selector';
import { createUseStyles } from 'react-jss';
import { Toast } from 'external/src/entrypoints/admin/components/Toast.tsx';
import {
  useCreateStripeCustomerMutation,
  useUpdateCustomerMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { StripeInvoiceInfo } from 'external/src/entrypoints/admin/components/StripeInvoiceInfo.tsx';
import { StripeInvoiceCreation } from 'external/src/entrypoints/admin/components/StripeInvoiceCreation.tsx';
import type {
  PricingTier,
  BillingType,
} from 'external/src/graphql/operations.ts';
import type {
  AddonInput,
  CustomerQueryResult,
  UpdateCustomerMutationVariables,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { PlanDescription } from 'external/src/entrypoints/admin/components/PlanDescription.tsx';
import type { DescriptionLine } from 'external/src/entrypoints/admin/components/PlanDescription.tsx';
import { AddonsInput } from 'external/src/entrypoints/admin/components/AddonsInput.tsx';
import { StripeCustomerIDInput } from 'external/src/entrypoints/admin/components/StripeCustomerIDInput.tsx';
import type { Nullable } from 'common/types/index.ts';

const useStyles = createUseStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBlockStart: 12,
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    paddingBlockStart: 8,
  },
  card: { width: '100%' },
  cardHeader: { fontWeight: 'bold', fontSize: '1.25em' },
});

export default function TabBilling({
  customer,
  refetch,
}: {
  customer: CustomerQueryResult['customer'];
  refetch: () => Promise<void>;
}) {
  const classes = useStyles();

  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [postcode, setPostcode] = useState<string>('');

  const onToastClose = useCallback(
    (_event: React.SyntheticEvent | Event, _reason?: string) => {
      setError(null);
    },
    [],
  );

  const [createStripeCustomer] = useCreateStripeCustomerMutation();

  const onCustomerCreateClick = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const onCustomerCreateClickImpl = async () => {
        if (!customer) {
          return;
        }

        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
          const result = await createStripeCustomer({
            variables: {
              id: customer.id,
              email,
              country: country!,
              postcode,
            },
          });

          if (
            !result.errors &&
            result.data?.createStripeCustomer.success === true
          ) {
            void refetch();
          } else {
            setError(
              `An error happened when creating the customer: ${result.data?.createStripeCustomer?.failureDetails?.message}`,
            );
          }
        }
      };

      void onCustomerCreateClickImpl();
    },
    [country, createStripeCustomer, customer, email, postcode, refetch],
  );

  const onEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    [],
  );

  const onPostcodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPostcode(e.target.value);
    },
    [],
  );

  const body = useMemo(() => {
    if (!customer) {
      return <>Loading...</>;
    } else if (!customer.stripeCustomerID) {
      return (
        <Form onSubmit={onCustomerCreateClick} className={classes.form}>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Customer email</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="email" id="email" onChange={onEmailChange} />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Country</InputGroup.Text>
            </InputGroup.Prepend>
            <CountryDropdown
              value={country ?? ''}
              valueType="short"
              onChange={setCountry}
            />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Post code</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              id="postcode"
              value={postcode ?? ''}
              onChange={onPostcodeChange}
            />
          </InputGroup>
          <Button
            type="submit"
            disabled={
              !email ||
              email === '' ||
              !country ||
              country === '' ||
              postcode === ''
            }
            style={{ width: 'fit-content' }}
          >
            Create Stripe Customer
          </Button>
        </Form>
      );
    } else if (customer.stripeSubscription) {
      return <StripeInvoiceInfo customer={customer} />;
    } else {
      return (
        <StripeInvoiceCreation
          customer={customer}
          refetch={refetch}
          setError={setError}
        />
      );
    }
  }, [
    classes.form,
    country,
    customer,
    email,
    onCustomerCreateClick,
    onEmailChange,
    onPostcodeChange,
    postcode,
    refetch,
  ]);

  return (
    <div className={classes.wrapper}>
      <Card className={classes.card}>
        <Card.Header className={classes.cardHeader}>
          Stripe subscription
        </Card.Header>
        <Card.Body>{body}</Card.Body>
      </Card>
      <Card className={classes.card}>
        <Card.Header className={classes.cardHeader}>
          Customer settings
        </Card.Header>
        <Card.Body>
          <BillingSettings customer={customer} refetch={refetch} />
        </Card.Body>
      </Card>

      <Toast
        message={error ?? ''}
        isOpen={error !== null}
        onClose={onToastClose}
      />
    </div>
  );
}

function BillingSettings({
  customer,
  refetch,
}: {
  customer: CustomerQueryResult['customer'];
  refetch: () => Promise<void>;
}) {
  const [updateCustomer] = useUpdateCustomerMutation();
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [billingType, setBillingType] = useState<Nullable<BillingType>>(null);
  const [billingStatus, setBillingStatus] = useState<string>('');
  const [pricingTier, setPricingTier] = useState<PricingTier | ''>('');
  const [stripeCustomerID, setStripeCustomerID] = useState<string | null>(null);
  const [addons, setAddons] = useState<AddonInput[]>([]);
  const [planDescription, setPlanDescription] = useState<DescriptionLine[]>([]);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setPricingTier(customer.pricingTier);
      setBillingType(customer.billingType);
      setBillingStatus(customer.billingStatus);
      setStripeCustomerID(customer.stripeCustomerID);
      setAddons(customer.addons ?? []);
      setRenewalDate(
        customer.renewalDate
          ? new Date(customer.renewalDate).toISOString().split('T')[0]
          : '',
      );
      setPlanDescription(
        customer.planDescription.map((line, idx) => {
          return { text: line, id: idx };
        }),
      );
    }
  }, [customer]);

  const onSettingsSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const onSubmitImpl = async () => {
        if (!customer) {
          return;
        }

        // This is a value that's only ok when loading the data, so we should never save it
        if (pricingTier === '') {
          throw new Error('invalid pricing tier');
        }

        const variables: UpdateCustomerMutationVariables = {
          id: customer.id,
          renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
          // The next two flags are undefined for backwards compatibility reasons
          enableCustomS3Bucket: undefined,
          enableCustomSegmentWriteKey: undefined,
          pricingTier,
          billingType,
          billingStatus,
          stripeCustomerID,
          addons,
          planDescription: planDescription.map((line) => line.text),
          name: undefined,
          type: undefined,
          implementationStage: undefined,
          launchDate: undefined,
          slackChannel: undefined,
        };
        const result = await updateCustomer({ variables });
        if (!result.errors && result.data?.updateCustomer.success === true) {
          setSuccess(true);
          await refetch();
        }

        setSaving(false);
      };

      setSaving(true);
      setSuccess(false);
      e.preventDefault();
      void onSubmitImpl();
    },
    [
      customer,
      renewalDate,
      pricingTier,
      billingType,
      billingStatus,
      stripeCustomerID,
      addons,
      planDescription,
      refetch,
      updateCustomer,
    ],
  );

  if (!customer) {
    return <>Loading customer...</>;
  }

  return (
    <div style={{ paddingBlockStart: 12 }}>
      <Form
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        onSubmit={onSettingsSubmit}
      >
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Pricing Tier</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="select"
            value={pricingTier}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPricingTier(e.target.value as PricingTier);
            }}
          >
            <option value="free">Starter</option>
            <option value="pro">Pro</option>
            <option value="scale">Premium</option>
          </Form.Control>
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Billing Status</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="select"
            value={billingStatus}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setBillingStatus(e.target.value);
            }}
          >
            <option value="" disabled hidden>
              unknown
            </option>
            {['active', 'unpaid', 'inactive'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Form.Control>
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Billing Type</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="select"
            value={billingType ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setBillingType(e.target.value as BillingType);
            }}
          >
            <option value="stripe">Stripe</option>
            <option value="manual">Manual</option>
            <option value="" disabled hidden>
              unknown
            </option>
          </Form.Control>
        </InputGroup>
        <StripeCustomerIDInput
          editable
          initialCustomerID={customer.stripeCustomerID}
          onStripeCustomerIDChange={setStripeCustomerID}
        />
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Renewal Date</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="date"
            value={renewalDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRenewalDate(e.target.value)
            }
          ></Form.Control>
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Addons</InputGroup.Text>
          </InputGroup.Prepend>
          <AddonsInput data={addons} onChange={setAddons} />
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Plan description</InputGroup.Text>
          </InputGroup.Prepend>
          <PlanDescription
            data={planDescription}
            onChange={setPlanDescription}
          />
        </InputGroup>
        <div>
          <Button style={{ width: '100px' }} type={'submit'} disabled={saving}>
            {saving ? 'Updating' : 'Update'}
          </Button>
          {success ? (
            <span style={{ marginInlineStart: 8 }}>
              Changes saved succesfully
            </span>
          ) : null}
        </div>
      </Form>
    </div>
  );
}
