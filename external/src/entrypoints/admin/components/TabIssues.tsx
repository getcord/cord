import { Accordion, Button, Card } from 'react-bootstrap';
import { useCallback, useMemo } from 'react';
import { IssueDataTable } from 'external/src/entrypoints/admin/pages/Issues.tsx';
import { CreateCRTIssue } from 'external/src/entrypoints/admin/components/crt/CreateCRTIssue.tsx';
import type { AdminCRTCustomerIssue } from 'common/types/index.ts';
import { useCreateNewIssue } from 'external/src/entrypoints/admin/hooks/useCreateNewIssue.tsx';
import { useCustomerIssuesQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';

export function TabIssues({ customerID }: { customerID: string }) {
  const { data: customerIssueData, refetch: refetchCustomerIssues } =
    useCustomerIssuesQuery({
      variables: { customerID },
    });

  const customerOpenIssuesTableData = useMemo(
    () =>
      customerIssueData?.customerIssues.filter(
        (record) => record.nextAction !== 'done',
      ),
    [customerIssueData],
  );

  const customerClosedIssuesTableData = useMemo(
    () =>
      customerIssueData?.customerIssues.filter(
        (record) => record.nextAction === 'done',
      ),
    [customerIssueData],
  );

  const createNewIssue = useCreateNewIssue();
  const onCreateIssue = useCallback(
    async (issue: AdminCRTCustomerIssue) => {
      await createNewIssue(issue);
      await refetchCustomerIssues();
    },
    [createNewIssue, refetchCustomerIssues],
  );

  return (
    <>
      <Accordion>
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Create New Issue
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <CreateCRTIssue
                customerID={customerID}
                onCreateIssue={onCreateIssue}
              />
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>

      <IssueDataTable
        title="Active Issues"
        issues={customerOpenIssuesTableData}
      />
      <IssueDataTable
        title="Closed Issues"
        issues={customerClosedIssuesTableData}
      />
    </>
  );
}
