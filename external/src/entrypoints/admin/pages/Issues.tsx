import { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Accordion, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PresenceFacepile } from '@cord-sdk/react';

import type {
  AllCustomerIssuesQueryResult,
  CustomerIssuesQueryResult,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import {
  useAdminPlatformUsersQuery,
  useAllCustomerIssuesQuery,
} from 'external/src/entrypoints/admin/graphql/operations.ts';

import type { AdminCRTCustomerIssue } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { CreateCRTIssue } from 'external/src/entrypoints/admin/components/crt/CreateCRTIssue.tsx';
import { useCreateNewIssue } from 'external/src/entrypoints/admin/hooks/useCreateNewIssue.tsx';
import { LocationBadge } from 'external/src/entrypoints/admin/components/LocationBadge.tsx';
import {
  CUSTOMER_ISSUE_NEXT_ACTIONS,
  CUSTOMER_ISSUE_NEXT_ACTION_ORDER,
} from 'external/src/entrypoints/admin/pages/Issue.tsx';

const APP_NAMES = [
  'Cordday.com',
  'Corjira',
  'CorTrello',
  'Trellcord',
  'CoRT',
  'CoRq',
  'CAsana',
  'Corsana',
  'Asancord',
  'Cordzilla',
  'Lineacord',
  'Cordear',
  'Lincordear',
  'ProductCord',
  'BaseCord',
  'CordCamp',
  'ToCordist',
  'Microcord Request Tracker for Workgroups Pro Edition',
];

function randomAppName() {
  return APP_NAMES[Math.floor(Math.random() * APP_NAMES.length)];
}

export function Issues() {
  const createNewIssue = useCreateNewIssue();

  const [appName] = useState(randomAppName());

  const { data: adminPlatformUsersQueryResults } = useAdminPlatformUsersQuery();

  const assignees = useMemo(() => {
    if (adminPlatformUsersQueryResults) {
      return adminPlatformUsersQueryResults?.adminPlatformUsers.map(
        (adminUser) => adminUser.user,
      );
    }
    return [];
  }, [adminPlatformUsersQueryResults]);

  const { data: issueData, refetch: refetchIssues } =
    useAllCustomerIssuesQuery();

  const activeIssues = useMemo(
    () => issueData?.customerIssues.filter((i) => i.nextAction !== 'done'),
    [issueData],
  );
  const closedIssues = useMemo(
    () => issueData?.customerIssues.filter((i) => i.nextAction === 'done'),
    [issueData],
  );

  const onCreateIssue = useCallback(
    async (issue: AdminCRTCustomerIssue) => {
      await createNewIssue(issue);
      void refetchIssues();
    },
    [createNewIssue, refetchIssues],
  );

  return (
    <>
      <Helmet>
        <title>Cord Admin - Issues</title>
      </Helmet>

      <h1>
        Welcome to <i>{appName}</i>
      </h1>
      <Accordion>
        <Accordion.Toggle eventKey="0" as={Button} variant="secondary">
          New Issue
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <CreateCRTIssue onCreateIssue={onCreateIssue} assignees={assignees} />
        </Accordion.Collapse>
      </Accordion>

      <IssueDataTable title="Active Issues" issues={activeIssues} />

      <IssueDataTable title="Closed Issues" issues={closedIssues} />
    </>
  );
}

export function IssueDataTable({
  title,
  issues,
}: {
  title?: string;
  issues:
    | AllCustomerIssuesQueryResult['customerIssues']
    | CustomerIssuesQueryResult['customerIssues']
    | undefined;
}) {
  const tableData = useMemo(
    () =>
      issues?.map((record) => ({
        unread: record.id, // this is so we get the badge in activity api
        title: { id: record.id, title: record.title },
        ...('customer' in record && { customer: record.customer }),
        nextAction: record.nextAction,
        'Last Touch': record.lastTouch,
        priority: record.priority,
        assignee: record.assignee,
        viewedBy: record.id, // this is so we get the location of presence
      })),
    [issues],
  );
  return (
    <DataTable
      title={title}
      data={tableData}
      sort={{
        title: (a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
        customer: (a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        nextAction: (a, b) =>
          CUSTOMER_ISSUE_NEXT_ACTION_ORDER[
            a as keyof typeof CUSTOMER_ISSUE_NEXT_ACTION_ORDER
          ] -
          CUSTOMER_ISSUE_NEXT_ACTION_ORDER[
            b as keyof typeof CUSTOMER_ISSUE_NEXT_ACTION_ORDER
          ],
        assignee: (a, b) => {
          if (a === null && b === null) {
            return 0;
          } else if (a === null) {
            return -1;
          } else if (b === null) {
            return 1;
          } else {
            return a.displayName
              .toLowerCase()
              .localeCompare(b.displayName.toLowerCase());
          }
        },
        'Last Touch': (a, b) => {
          if (a === null && b === null) {
            return 0;
          } else if (a === null) {
            return -1;
          } else if (b === null) {
            return 1;
          } else {
            const aDate = new Date(a);
            const bDate = new Date(b);
            if (aDate.getTime() === bDate.getTime()) {
              return 0;
            } else if (aDate.getTime() < bDate.getTime()) {
              return -1;
            } else {
              return 1;
            }
          }
        },
      }}
      render={{
        title: (data: any) => (
          <Link to={AdminRoutes.ISSUES + '/' + data.id}>{data.title}</Link>
        ),
        customer: (data: any) => (
          <Link to={AdminRoutes.CUSTOMERS + '/' + data.id}>{data.name}</Link>
        ),
        nextAction: (data) => (
          <>
            {
              CUSTOMER_ISSUE_NEXT_ACTIONS[
                data as keyof typeof CUSTOMER_ISSUE_NEXT_ACTIONS
              ]
            }
          </>
        ),
        'Last Touch': (data: any, defaultRender) => (
          <>
            {data === null
              ? defaultRender
              : new Date(data as string).toLocaleDateString('en-GB')}
          </>
        ),
        assignee: (data: any, defaultRender) => (
          <>
            {data === null ? (
              defaultRender
            ) : (
              <Link to={AdminRoutes.WHOIS + '/user/' + data.id}>
                {data.displayName}
              </Link>
            )}
          </>
        ),
        viewedBy: (data, _defaultRender) => (
          <PresenceFacepile
            location={{ issue: data as string }}
            exactMatch={true}
            style={{ height: 50 }}
          />
        ),
        unread: (data, _defaultRender) => (
          <LocationBadge issue={data as string} />
        ),
      }}
    />
  );
}
