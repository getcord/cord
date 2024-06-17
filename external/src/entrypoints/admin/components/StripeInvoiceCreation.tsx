import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import type {
  CreateStripeSubscriptionMutationVariables,
  CustomerQueryResult,
  PricingTier,
  AddonInput,
  UpdateCustomerMutationVariables,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import {
  useCreateStripeSubscriptionMutation,
  useUpdateCustomerMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import type { DescriptionLine } from 'external/src/entrypoints/admin/components/PlanDescription.tsx';
import { PlanDescription } from 'external/src/entrypoints/admin/components/PlanDescription.tsx';
import { AddonsInput } from 'external/src/entrypoints/admin/components/AddonsInput.tsx';

const useStyles = createUseStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBlockStart: 12,
  },
});

export function StripeInvoiceCreation({
  customer,
  refetch,
  setError,
}: {
  customer: CustomerQueryResult['customer'];
  refetch: () => Promise<void>;
  setError: (error: string) => void;
}) {
  const classes = useStyles();

  const [price, setPrice] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState<string>('monthly');
  const [pricingTier, setPricingTier] = useState<string>('scale');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [addons, setAddons] = useState<AddonInput[]>([]);
  const [planDescription, setPlanDescription] = useState<DescriptionLine[]>([]);

  const [createStripeSubscription] = useCreateStripeSubscriptionMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  useEffect(() => {
    if (!customer) {
      return;
    }
    setPlanDescription(
      customer.planDescription.map((line, idx) => {
        return { text: line, id: idx };
      }),
    );
    setAddons(customer.addons ?? []);
  }, [customer]);

  const onPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const floatValue = Number.parseFloat(e.target.value);
      setPrice(Math.round(floatValue * 100));
    },
    [],
  );

  const onInvoiceCreateClick = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const onInvoiceCreateClickImpl = async () => {
        if (!customer) {
          return;
        }
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();

        if (!form.checkValidity()) {
          return;
        }
        setCreatingInvoice(true);

        // Update addons and plan description first
        const variablesUpdate: UpdateCustomerMutationVariables = {
          id: customer.id,
          addons,
          planDescription: planDescription.map((line) => line.text),
          name: undefined,
          type: undefined,
          implementationStage: undefined,
          launchDate: undefined,
          enableCustomS3Bucket: undefined,
          enableCustomSegmentWriteKey: undefined,
          slackChannel: undefined,
          pricingTier: undefined,
          billingType: undefined,
          billingStatus: undefined,
          stripeCustomerID: undefined,
          renewalDate: undefined,
        };
        const resultUpdate = await updateCustomer({
          variables: variablesUpdate,
        });
        if (resultUpdate.errors || !resultUpdate.data?.updateCustomer.success) {
          setError('An error happened when updating the customer');
        } else {
          // Then create stripe subscription
          const variables: CreateStripeSubscriptionMutationVariables = {
            id: customer.id,
            price: price!,
            recurrence,
            pricingTier: pricingTier as PricingTier,
          };

          const result = await createStripeSubscription({
            variables,
          });

          if (
            !result.errors &&
            result.data?.createStripeSubscription.success === true
          ) {
            void refetch();
          } else {
            setError(
              `An error happened when creating the invoice: ${result.data?.createStripeSubscription?.failureDetails?.message}`,
            );
          }
        }
        setCreatingInvoice(false);
      };
      void onInvoiceCreateClickImpl();
    },
    [
      addons,
      createStripeSubscription,
      customer,
      planDescription,
      price,
      pricingTier,
      recurrence,
      refetch,
      setError,
      updateCustomer,
    ],
  );

  const stripeCustomerURL = `https://dashboard.stripe.com/customers/${customer?.stripeCustomerID}`;

  return (
    <Form onSubmit={onInvoiceCreateClick} className={classes.form}>
      <span>
        Remember! make sure the{' '}
        <a href={stripeCustomerURL} target="_blank" rel="noreferrer">
          address details
        </a>{' '}
        are up to date. Once the invoice has been created, it cannot be
        modified.
      </span>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>Pricing Tier</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          as="select"
          value={pricingTier}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPricingTier(e.target.value)
          }
        >
          <option value="scale">Premium</option>
          <option value="pro">Pro</option>
        </Form.Control>
      </InputGroup>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>Price</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          type="number"
          min="0.00"
          step="0.01"
          onChange={onPriceChange}
          value={price ? price / 100 : ''}
        />
      </InputGroup>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>Recurrence</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          as="select"
          value={recurrence}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRecurrence(e.target.value)
          }
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </Form.Control>
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
        <PlanDescription data={planDescription} onChange={setPlanDescription} />
      </InputGroup>
      <div>
        <Button
          type="submit"
          disabled={!price || !pricingTier || creatingInvoice}
          style={{ width: 'fit-content' }}
        >
          {creatingInvoice
            ? 'Creating subscription'
            : 'Create Stripe subscription'}
        </Button>
        <span style={{ marginInlineStart: 8 }}>
          Creating a subscription will send an email with the invoice to the
          customer.
        </span>
      </div>
    </Form>
  );
}
