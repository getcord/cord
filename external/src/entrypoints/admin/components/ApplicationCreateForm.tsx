import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useCreateApplicationMutation } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import type { UUID } from 'common/types/index.ts';

export function ApplicationCreateForm(props: { customerID: UUID }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [createApplicationMutation, { called }] =
    useCreateApplicationMutation();

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const result = await createApplicationMutation({
        variables: { name, customerID: props.customerID },
      });
      const id = result.data?.createApplication;

      if (id) {
        navigate(`${AdminRoutes.APPLICATIONS}/${id}`);
      } else {
        console.error(result.errors);
      }
      return false;
    },
    [name, createApplicationMutation, navigate, props.customerID],
  );

  return (
    <Form onSubmit={(e) => void onSubmit(e)}>
      <h3>Create application</h3>
      <Form.Group>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Name</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            placeholder="Name of the integration partner's company / entity"
            value={name}
            disabled={called}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          <InputGroup.Append>
            <Button type="submit" disabled={name.length === 0}>
              Create
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </Form>
  );
}
