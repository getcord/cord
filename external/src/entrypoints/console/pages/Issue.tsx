import { Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import {
  useConsoleUserQuery,
  useGetCustomerIssueInConsoleQuery,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { PresenceObserver, Thread } from '@cord-sdk/react';

function IssueCard(props: { issueID: UUID }) {
  const { data, loading } = useGetCustomerIssueInConsoleQuery({
    variables: { id: props.issueID },
  });
  if (loading) {
    return null;
  }
  if (!data || !data.getCustomerIssue) {
    return <div>You shall not pass</div>;
  }
  return (
    <>
      <div>ID : {data.getCustomerIssue.id}</div>
      <div>Title : {data.getCustomerIssue.title}</div>
      <div>Body : {data.getCustomerIssue.body}</div>
      <div>Type : {data.getCustomerIssue.type}</div>
      <div>Priority : {data.getCustomerIssue.priority}</div>
    </>
  );
}

export function Issue() {
  const { data } = useConsoleUserQuery();
  const { id: issueID } = useUnsafeParams<{ id: UUID }>();
  const id = data?.consoleUser?.customer?.id;

  return (
    <>
      <Helmet>
        <title>Issue</title>
      </Helmet>
      {!id ? (
        <Spinner animation="border" />
      ) : (
        <>
          <PresenceObserver location={{ issue: issueID }} durable={true}>
            <IssueCard issueID={issueID} />
            <Thread location={{ issueID }} threadId={issueID} />
          </PresenceObserver>
        </>
      )}
    </>
  );
}
