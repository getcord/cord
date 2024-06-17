import { useCallback } from 'react';
import { Button, Card, Spinner, Accordion, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';
import {
  useConsoleCustomerIssuesQuery,
  useConsoleUserQuery,
  useCreateCustomerIssueInConsoleMutation,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { CreateCRTIssue } from 'external/src/entrypoints/admin/components/crt/CreateCRTIssue.tsx';
import type { AdminCRTCustomerIssue, UUID } from 'common/types/index.ts';

type Props = {
  customerID: UUID;
};

function tableRow(
  id: string,
  title: string,
  body: string,
  type: string,
  priority: string,
) {
  return (
    <tr key={id}>
      <td>
        <Link to={ConsoleRoutes.ISSUES + '/' + id}>{title}</Link>
      </td>
      <td>{body}</td>
      <td>{type}</td>
      <td>{priority}</td>
    </tr>
  );
}

function IssuesCard({ customerID }: Props) {
  const { data, loading } = useConsoleCustomerIssuesQuery();

  const [createCustomerIssuesFromConsoleMutation] =
    useCreateCustomerIssueInConsoleMutation();

  const createNewIssue = useCallback(
    async (customerIssue: AdminCRTCustomerIssue) => {
      const { title, body, type, priority } = customerIssue;

      await createCustomerIssuesFromConsoleMutation({
        variables: {
          title,
          body,
          type,
          priority,
        },
      });
    },
    [createCustomerIssuesFromConsoleMutation],
  );

  if (loading) {
    return null;
  }

  return (
    <Card>
      <Accordion>
        <Card.Header style={{ display: 'flex' }}>
          <h3>Current open Issues</h3>
          <Accordion.Toggle
            as={Button}
            variant="secondary"
            eventKey="0"
            style={{ marginLeft: 'auto' }}
          >
            New issue
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey="0">
          <CreateCRTIssue
            customerID={customerID}
            fieldsToHide={[
              'customerID',
              'comingFrom',
              'decision',
              'communicationStatus',
              'assignee',
              'externallyVisible',
            ]}
            onCreateIssue={createNewIssue}
          />
        </Accordion.Collapse>
      </Accordion>

      <Card.Body>List of issues</Card.Body>
      <Table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Body</th>
            <th>Type</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {data?.customerIssues.map(({ id, title, body, type, priority }) => {
            return tableRow(id, title, body, type, priority);
          })}
        </tbody>
      </Table>
    </Card>
  );
}

export function Issues() {
  const { data } = useConsoleUserQuery();
  const id = data?.consoleUser?.customer?.id;

  return (
    <>
      <Helmet>
        <title>Issues</title>
      </Helmet>
      {!id ? <Spinner animation="border" /> : <IssuesCard customerID={id} />}
    </>
  );
}
