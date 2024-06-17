import * as React from 'react';
import type { Classes } from 'jss';
import { Button } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import type { CustomerIssueQueryResult } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type { ClientMessageData, ThreadData } from '@cord-sdk/types';
import { Message, thread, Composer } from '@cord-sdk/react';
import type { ViewAndEditAdminCRTCustomerIssue } from 'external/src/entrypoints/admin/pages/Issue.tsx';

type CustomerIssueChange =
  CustomerIssueQueryResult['customerIssue']['history'][number];

type MessageOrIssueChange =
  | { ty: 'message'; time: number; message: ClientMessageData }
  | { ty: 'change'; time: number; change: CustomerIssueChange };

type Props = {
  issue: ViewAndEditAdminCRTCustomerIssue;
  changes: CustomerIssueChange[] | undefined;
  classes: Classes<'fieldName' | 'value'>;
};

export function InternalThreadAndHistory(props: Props) {
  const { issue, changes, classes } = props;

  const threadName = issue.customerName + ' Issue : ' + issue.title;
  const location = { issue: issue.id };

  const threadData = thread.useThreadData(issue.id, {
    location,
    threadName,
  });

  if (!changes || (threadData.loading && threadData.messages.length === 0)) {
    return <div>Loading...</div>;
  }

  const combined: MessageOrIssueChange[] = [];
  threadData.messages.forEach((message) =>
    combined.push({
      ty: 'message',
      time: message.createdTimestamp.getTime(),
      message,
    }),
  );
  changes.forEach((change) =>
    combined.push({
      ty: 'change',
      time: new Date(change.timestamp).getTime(),
      change,
    }),
  );
  combined.sort((a, b) => a.time - b.time);

  return (
    <>
      <div>
        <LoadMoreButton threadData={threadData} />
      </div>
      {combined.map((i) =>
        i.ty === 'message' ? (
          <MessageItem key={i.time} message={i.message} issueId={issue.id} />
        ) : (
          <ChangeItem key={i.time} change={i.change} classes={classes} />
        ),
      )}
      <Composer
        threadId={issue.id}
        location={location}
        threadName={threadName}
        style={{ margin: '8px -8px 0 -8px' }}
      />
    </>
  );
}

function LoadMoreButton({ threadData }: { threadData: ThreadData }) {
  if (!threadData.hasMore) {
    return null;
  }

  if (threadData.loading) {
    return <Button disabled>Loading more messages...</Button>;
  }

  return (
    <Button onClick={() => void threadData.fetchMore(10)}>
      Load more messages
    </Button>
  );
}

function MessageItem({
  message,
  issueId,
}: {
  message: ClientMessageData;
  issueId: UUID;
}) {
  return <Message threadId={issueId} messageId={message.id} />;
}

function ChangeItem({
  change,
  classes,
}: {
  change: CustomerIssueChange;
  classes: Classes<'fieldName' | 'value'>;
}) {
  return (
    <div>
      {new Date(change.timestamp).toLocaleString('en-GB')}:{' '}
      {change.user.displayName} {changeDescription(change, classes)}
    </div>
  );
}

function changeDescription(
  change: CustomerIssueQueryResult['customerIssue']['history'][number],
  classes: Classes<'fieldName' | 'value'>,
) {
  if (change.created) {
    return <>created this issue</>;
  }
  const updates = change.updated;
  if (change.updated.length === 1) {
    const update = updates[0];
    return (
      <>
        updated <span className={classes.fieldName}>{update.field}</span> from{' '}
        <span className={classes.value}>{`${update.oldValue ?? 'null'}`}</span>{' '}
        to{' '}
        <span className={classes.value}>{`${update.newValue ?? 'null'}`}</span>
      </>
    );
  } else if (change.updated.length === 2) {
    return (
      <>
        updated <span className={classes.fieldName}>{updates[0].field}</span>{' '}
        from{' '}
        <span className={classes.value}>{`${
          updates[0].oldValue ?? 'null'
        }`}</span>{' '}
        to{' '}
        <span className={classes.value}>{`${
          updates[0].newValue ?? 'null'
        }`}</span>{' '}
        and <span className={classes.fieldName}>{updates[1].field}</span> from{' '}
        <span className={classes.value}>{`${
          updates[1].oldValue ?? 'null'
        }`}</span>{' '}
        to{' '}
        <span className={classes.value}>{`${
          updates[1].newValue ?? 'null'
        }`}</span>
      </>
    );
  } else {
    return (
      <>
        updated{' '}
        {updates.map((u, i) => (
          <React.Fragment key={i}>
            {i !== 0 && ','}
            {i === updates.length - 1 && ' and'}{' '}
            <span className={classes.fieldName}>{u.field}</span>
          </React.Fragment>
        ))}
      </>
    );
  }
}
