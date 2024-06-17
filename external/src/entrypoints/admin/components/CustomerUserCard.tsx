import { useState } from 'react';
import { Button, Form, InputGroup, Spinner, Table } from 'react-bootstrap';
import {
  useAddConsoleUserToCustomerMutation,
  useCustomerConsoleUsersQuery,
  useRemoveConsoleUserFromCustomerMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';

export default function TabConsoleUsers({ id }: { id: UUID }) {
  const [userEmail, setUserEmail] = useState('');
  const [sendEmailInvites, setSendEmailInvites] = useState(true);
  const [invalidResponse, setInvalidResponse] = useState<boolean | null>(null);
  const [addConsoleUserToCustomer] = useAddConsoleUserToCustomerMutation();

  const [removeConsoleUserFromCustomer] =
    useRemoveConsoleUserFromCustomerMutation();

  const { data, loading, refetch } = useCustomerConsoleUsersQuery({
    variables: { customerID: id },
  });

  return (
    <>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table striped={true} bordered={true}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.customerConsoleUsers.map((row, index) => (
              <tr key={index}>
                <td>{row.email}</td>
                <td>{row.name}</td>
                <td>{row.pendingCustomerID ? 'pending' : 'approved'}</td>
                <td>
                  {!row.pendingCustomerID && (
                    <Button
                      variant="danger"
                      disabled={!row?.email}
                      onClick={() => {
                        void removeConsoleUserFromCustomer({
                          variables: { email: row.email, customerID: id },
                        }).then((response) => {
                          if (
                            response?.data?.removeConsoleUserFromCustomer
                              ?.success
                          ) {
                            void refetch();
                          }
                        });
                      }}
                    >
                      Revoke Access
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Form
        onSubmit={() => {
          void addConsoleUserToCustomer({
            variables: { email: userEmail, customerID: id, sendEmailInvites },
          }).then((response) => {
            if (!response?.data?.addConsoleUserToCustomer?.success) {
              setInvalidResponse(true);
            } else {
              void refetch();
            }
          });
        }}
      >
        <Form.Group>
          <h4>Add new users</h4>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Send signup email invites</InputGroup.Text>
            </InputGroup.Prepend>
            <input
              style={{ marginLeft: '4px' }}
              type="checkbox"
              checked={sendEmailInvites}
              onChange={(e) => {
                setSendEmailInvites(e.target.checked);
              }}
            />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Email(s)</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="email"
              multiple
              placeholder="alice@example.com, bob@example.com"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value);
                setInvalidResponse(null);
              }}
              isInvalid={invalidResponse === true}
            />
            <InputGroup.Append>
              <Button type="submit" disabled={userEmail.length === 0}>
                Add
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Form.Group>
      </Form>
    </>
  );
}
