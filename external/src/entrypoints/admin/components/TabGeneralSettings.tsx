import { InputGroup, Button, Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import type {
  CustomerType,
  CustomerImplementationStage,
} from 'common/types/index.ts';
import { useUpdateCustomerMutation } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type {
  CustomerQueryResult,
  UpdateCustomerMutationVariables,
} from 'external/src/entrypoints/admin/graphql/operations.ts';

export function TabGeneralSettings({
  customerData,
}: {
  customerData: CustomerQueryResult['customer'];
}) {
  const [updateCustomer] = useUpdateCustomerMutation();
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>('verified');
  const [implementationStage, setImplementationStage] =
    useState<CustomerImplementationStage>('proof_of_concept');
  const [launchDate, setLaunchDate] = useState<string>('');
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [slackChannel, setSlackChannel] = useState('');

  useEffect(() => {
    if (customerData) {
      setName(customerData.name);
      setType(customerData.type);
      setImplementationStage(customerData.implementationStage);
      setLaunchDate(
        customerData.launchDate
          ? new Date(customerData.launchDate).toISOString().split('T')[0]
          : '',
      );

      setSlackChannel(customerData.slackChannel ?? '');
      setRenewalDate(
        customerData.renewalDate
          ? new Date(customerData.renewalDate).toISOString().split('T')[0]
          : '',
      );
    }
  }, [customerData]);

  if (!customerData) {
    return <>Loading customer...</>;
  }

  return (
    <div style={{ paddingBlockStart: 12 }}>
      <Form
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();

          let variables: UpdateCustomerMutationVariables = {
            id: customerData.id,
            name: undefined,
            type,
            implementationStage,
            launchDate: launchDate ? new Date(launchDate).toISOString() : null,
            renewalDate: renewalDate
              ? new Date(renewalDate).toISOString()
              : null,
            // The next two flags are undefined for backwards compatibility reasons
            enableCustomS3Bucket: undefined,
            enableCustomSegmentWriteKey: undefined,
            slackChannel,
            pricingTier: undefined,
            billingType: undefined,
            billingStatus: undefined,
            stripeCustomerID: undefined,
            addons: undefined,
            planDescription: undefined,
          };
          if (name !== '') {
            variables = { ...variables, name: name };
          }
          const result = await updateCustomer({ variables });
          if (!result.errors && result.data?.updateCustomer.success === true) {
            location.reload();
          }
        }}
      >
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Name</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Customer Type</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="select"
            value={type}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setType(e.target.value as CustomerType)
            }
          >
            <option value="verified">Verified</option>
            <option value="sample">Sample</option>
          </Form.Control>
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Customer Stage</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            as="select"
            value={implementationStage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setImplementationStage(
                e.target.value as CustomerImplementationStage,
              )
            }
          >
            <option value="proof_of_concept">Proof of concept</option>
            <option value="implementing">Implementing</option>
            <option value="launched">Launched</option>
            <option value="inactive">Inactive</option>
          </Form.Control>
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Launch Date</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="date"
            value={launchDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLaunchDate(e.target.value)
            }
          ></Form.Control>
        </InputGroup>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Shared Slack Channel</InputGroup.Text>
          </InputGroup.Prepend>
          <input
            type="text"
            value={slackChannel}
            onChange={(e) => {
              setSlackChannel(e.target.value);
            }}
          />
        </InputGroup>
        <Button style={{ width: '100px' }} type={'submit'}>
          Update
        </Button>
      </Form>
    </div>
  );
}
