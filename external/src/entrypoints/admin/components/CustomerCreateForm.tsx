import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import {
  useCreateApplicationMutation,
  useCreateCustomerMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';

export function CustomerCreateForm() {
  const STAGING_SUFFIX = '-Staging';
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [createCustomerMutation, { called }] = useCreateCustomerMutation();
  const [
    createApplicationMutation,
    { called: createApplicationMutationCalled },
  ] = useCreateApplicationMutation();

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const result = await createCustomerMutation({
        variables: { name: customerName },
      });

      const id = result.data?.createCustomer;

      await createApplicationMutation({
        variables: { name: applicationName, customerID: id! },
      });

      if (id) {
        // Example code for creating new issues for new cutomers, when we decide to
        // do that:

        // await createNewIssue({
        //   customerID: id,
        //   title: 'Sample Task 1',
        //   body: 'First task for us',
        //   comingFrom: 'us',
        //   decision: 'pending',
        //   communicationStatus: 'none',
        //   lastTouch: undefined,
        //   type: 'onboarding_step',
        //   priority: 'blocker',
        //   externallyVisible: false,
        //   assignee: undefined,
        // });
        // await createNewIssue({
        //   customerID: id,
        //   title: 'Sample Task 2',
        //   body: 'First task for partner',
        //   comingFrom: 'us',
        //   decision: 'pending',
        //   communicationStatus: 'none',
        //   lastTouch: undefined,
        //   type: 'onboarding_step',
        //   priority: 'blocker',
        //   externallyVisible: true,
        //   assignee: undefined,
        // });
        navigate(`${AdminRoutes.CUSTOMERS}/${id}`);
      } else {
        console.error(result.errors);
      }

      return false;
    },
    [
      customerName,
      applicationName,
      createCustomerMutation,
      createApplicationMutation,
      navigate,
    ],
  );

  return (
    <Form onSubmit={(e) => void onSubmit(e)}>
      <Form.Group>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Name</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            placeholder="Name of the integration partner's company / entity"
            value={customerName}
            disabled={called}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setApplicationName(e.target.value + STAGING_SUFFIX);
            }}
          />
          <InputGroup.Prepend>
            <InputGroup.Text>First Application Name</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            placeholder="Name of the first application you want to create"
            value={customerName && customerName + STAGING_SUFFIX}
            disabled={createApplicationMutationCalled}
            readOnly
          />
          <InputGroup.Append>
            <Button type="submit" disabled={customerName.length === 0}>
              Create
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </Form>
  );
}
