import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  Spinner,
  Card,
  Form,
  Button,
  InputGroup,
  ButtonGroup,
  ToggleButton,
  Accordion,
  Alert,
} from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import Linkify = require('linkify-react');
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import { PresenceObserver } from '@cord-sdk/react';
import type {
  AdminCRTComingFrom,
  AdminCRTCommunicationStatus,
  AdminCRTCustomerIssue,
  AdminCRTDecision,
  AdminCRTIssueType,
  AdminCRTPriority,
  UUID,
} from 'common/types/index.ts';
import type {
  CustomerIssueQueryResult,
  AdminCRTNextAction,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import {
  useAddCustomerIssueSubscriptionMutation,
  useRemoveCustomerIssueSubscriptionMutation,
  useDeleteCustomerIssueMutation,
  useAdminPlatformUsersQuery,
  useCustomerIssueQuery,
  useUpdateCustomerIssueMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

import { CRTInputGroup } from 'external/src/entrypoints/admin/components/crt/CRTInputGroup.tsx';
import { CustomerThread } from 'external/src/entrypoints/admin/components/CustomerThread.tsx';
import { InternalThreadAndHistory } from 'external/src/entrypoints/admin/components/InternalThreadAndHistory.tsx';

export const CUSTOMER_ISSUE_NEXT_ACTIONS = {
  ack_receipt: 'Acknowledge receipt',
  make_decision: 'Make decision',
  send_decision: 'Send decision to customer',
  do_work: 'Do the work',
  wait_for_ack: 'Wait for customer (ping if stale)',
  done: '',
  unknown: '[Unknown, issue in weird state]',
} as const satisfies Record<AdminCRTNextAction, string>;

export const CUSTOMER_ISSUE_NEXT_ACTION_ORDER = {
  unknown: -1,
  ack_receipt: 0,
  make_decision: 1,
  send_decision: 2,
  do_work: 3,
  wait_for_ack: 4,
  done: 5,
} as const satisfies Record<AdminCRTNextAction, number>;

export const CUSTOMER_ISSUE_DECISIONS = {
  rejected: 'Rejected',
  pending: 'No decision',
  accepted: 'Accepted, not done',
  done: 'Done',
} as const satisfies Record<AdminCRTDecision, string>;

export const CUSTOMER_ISSUE_DECISION_ORDER = {
  pending: 0,
  accepted: 1,
  done: 2,
  rejected: 3,
} satisfies Record<AdminCRTDecision, number>;

export const CUSTOMER_ISSUE_COMM_STATUSES = {
  none: 'Request not yet acknowledged',
  request_acked: 'Request acknowledged',
  decision_sent: 'Decision communicated, waiting for acknowledgement',
  decision_acked: 'Decision acknowledged',
} as const satisfies Record<AdminCRTCommunicationStatus, string>;

export const CUSTOMER_ISSUE_COMM_STATUS_ORDER = {
  none: 0,
  request_acked: 1,
  decision_sent: 2,
  decision_acked: 3,
} satisfies Record<AdminCRTCommunicationStatus, number>;

export const CUSTOMER_ISSUE_TYPES = {
  request: 'Request',
  bug: 'Bug',
  onboarding_step: 'Onboarding step',
} satisfies Record<AdminCRTIssueType, string>;

export const CUSTOMER_ISSUE_PRIORITIES = {
  blocker: 'Blocker',
  high: 'High',
  low: 'Low',
} as const satisfies Record<AdminCRTPriority, string>;

export const CUSTOMER_ISSUE_REQ_CAME_FROM = {
  us: 'Cord',
  them: 'Customer',
} satisfies Record<AdminCRTComingFrom, string>;

export const CUSTOMER_ISSUE_VISIBILITY = {
  hide: 'Issue will be hidden from customer in dev console',
  show: 'Issue will appear in dev console for customer',
};

export type ViewAndEditAdminCRTCustomerIssue = {
  customerName: string;
  id: UUID;
} & AdminCRTCustomerIssue;

const useStyles = createUseStyles({
  changelog: {
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldName: {
    display: 'inline-block',
    borderRadius: '20px',
    padding: '0px 5px',
    background: '#E0E0E0',
  },
  value: {
    fontStyle: 'italic',
  },
});

export function Issue() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const classes = useStyles();
  const { data, loading } = useCustomerIssueQuery({ variables: { id } });

  const navigate = useNavigate();

  const [editingTitleAndDesc, setEditingTitleAndDesc] = useState(false);
  const [initialCustomerIssue, setInitialCustomerIssue] =
    useState<ViewAndEditAdminCRTCustomerIssue>();
  const [customerIssue, setCustomerIssue] =
    useState<ViewAndEditAdminCRTCustomerIssue>();
  const [issueChanges, setIssueChanges] =
    useState<CustomerIssueQueryResult['customerIssue']['history']>();
  const [nextAction, setNextAction] = useState<AdminCRTNextAction>();

  const [showInternalThread, setShowInternalThread] = useState(true);

  const [showAlert, setShowAlert] = useState<null | 'success' | 'error'>(null);

  const [updateCustomerIssueMutation] = useUpdateCustomerIssueMutation();
  const [deleteCustomerIssue] = useDeleteCustomerIssueMutation();
  const { data: adminPlatformUsersQueryResults } = useAdminPlatformUsersQuery();

  const [subscribed, setSubscribed] = useState(false);
  const [addCustomerIssueSubscriptionMutation] =
    useAddCustomerIssueSubscriptionMutation();
  const [removeCustomerIssueSubscriptionMutation] =
    useRemoveCustomerIssueSubscriptionMutation();

  const toggleThreadView = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === 'internal') {
        setShowInternalThread(true);
      } else {
        setShowInternalThread(false);
      }
    },
    [],
  );
  const updateCustomerIssue = useCallback(
    <T extends keyof AdminCRTCustomerIssue>(
      field: T,
      value: AdminCRTCustomerIssue[T],
    ) => {
      setCustomerIssue((prevValue) => {
        if (prevValue) {
          return { ...prevValue, [field]: value };
        }
        return;
      });
    },
    [],
  );

  const quickUpdate = useCallback(
    async ({
      lastTouch,
      decision,
      communicationStatus,
    }: {
      decision?: AdminCRTDecision;
      communicationStatus?: AdminCRTCommunicationStatus;
      lastTouch?: string;
    }) => {
      if (decision) {
        updateCustomerIssue('decision', decision);
      }
      if (communicationStatus) {
        updateCustomerIssue('communicationStatus', communicationStatus);
      }
      if (lastTouch) {
        updateCustomerIssue('lastTouch', lastTouch);
      }
      await updateCustomerIssueMutation({
        variables: {
          id,
          decision,
          communicationStatus,
          lastTouch,
          customerID: undefined,
          title: undefined,
          body: undefined,
          comingFrom: undefined,
          type: undefined,
          priority: undefined,
          externallyVisible: undefined,
          assignee: undefined,
        },
      });
    },
    [updateCustomerIssue, updateCustomerIssueMutation, id],
  );

  const unsavedChangesToData = useMemo(
    () => !isEqual(initialCustomerIssue, customerIssue),
    [customerIssue, initialCustomerIssue],
  );

  const saveCustomerIssue = useCallback(async () => {
    if (!customerIssue || !unsavedChangesToData) {
      setEditingTitleAndDesc(false);
      return;
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      id,
      title,
      body,
      decision,
      comingFrom,
      communicationStatus,
      lastTouch,
      customerID,
      type,
      priority,
      externallyVisible,
      assignee,
    } = customerIssue;
    const result = await updateCustomerIssueMutation({
      variables: {
        id,
        customerID,
        title,
        body,
        decision,
        comingFrom,
        communicationStatus,
        lastTouch: lastTouch ? new Date(lastTouch).toISOString() : null,
        type,
        priority,
        externallyVisible,
        assignee: assignee === 'placeholder' ? null : assignee,
      },
    });

    if (result.data?.updateCustomerIssue.success) {
      setInitialCustomerIssue(customerIssue);
      setEditingTitleAndDesc(false);
      setShowAlert('success');
    } else {
      setShowAlert('error');
    }
    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  }, [customerIssue, unsavedChangesToData, updateCustomerIssueMutation]);

  const deleteIssue = useCallback(async () => {
    if (window.confirm(`Delete issue "${customerIssue?.title}"?`)) {
      const result = await deleteCustomerIssue({ variables: { id } });
      if (result.data?.deleteCustomerIssue.success) {
        navigate(AdminRoutes.ISSUES);
      }
    }
  }, [deleteCustomerIssue, navigate, customerIssue?.title, id]);

  const updateSubscription = useCallback(async () => {
    if (subscribed) {
      await removeCustomerIssueSubscriptionMutation({
        variables: { issueID: id },
      });
      setSubscribed(false);
    } else {
      await addCustomerIssueSubscriptionMutation({
        variables: { issueID: id },
      });
      setSubscribed(true);
    }
  }, [
    addCustomerIssueSubscriptionMutation,
    removeCustomerIssueSubscriptionMutation,
    id,
    subscribed,
    setSubscribed,
  ]);

  useEffect(() => {
    if (data?.customerIssue) {
      const {
        customer,
        title,
        body,
        comingFrom,
        decision,
        communicationStatus,
        lastTouch,
        type,
        priority,
        externallyVisible,
        assignee,
      } = data.customerIssue;
      const initialCustomerIssueData = {
        id,
        customerID: customer.id,
        customerName: customer.name,
        title,
        body,
        comingFrom,
        decision,
        communicationStatus,
        lastTouch: lastTouch ?? '',
        type,
        priority,
        externallyVisible,
        assignee: assignee?.id ?? undefined,
      };
      setInitialCustomerIssue(initialCustomerIssueData);
      setCustomerIssue(initialCustomerIssueData);
      setIssueChanges(data.customerIssue.history);
      setNextAction(data.customerIssue.nextAction);
      setSubscribed(data.customerIssue.subscribed);
    }
  }, [data?.customerIssue, id]);

  if (loading || !data?.customerIssue || !customerIssue) {
    return <Spinner animation={'border'} />;
  }

  return (
    <>
      <Helmet>
        <title>Cord Admin - Issue</title>
      </Helmet>
      <PresenceObserver location={{ issue: id }} durable={true}>
        <Card>
          <Form>
            <Card.Header
              style={{ display: 'flex', gap: 16, position: 'relative' }}
            >
              {!editingTitleAndDesc ? (
                <h1>{customerIssue.title}</h1>
              ) : (
                <Form.Control
                  size="lg"
                  value={customerIssue.title}
                  onChange={(event) =>
                    updateCustomerIssue('title', event?.target.value)
                  }
                />
              )}
              {showAlert && (
                <Alert
                  onClose={() => setShowAlert(null)}
                  dismissible={true}
                  variant={showAlert === 'success' ? 'success' : 'danger'}
                  style={{
                    position: 'absolute',
                    top: 12,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    left: 0,
                    right: 0,
                    width: 360,
                  }}
                >
                  {showAlert === 'success'
                    ? 'Sucessfully Updated'
                    : 'Oops something went wrong'}
                </Alert>
              )}
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {unsavedChangesToData && (
                  <Button
                    type="button"
                    onClick={() => setCustomerIssue(initialCustomerIssue)}
                  >
                    Cancel Changes
                  </Button>
                )}
                {!editingTitleAndDesc && (
                  <Button
                    type="button"
                    onClick={() => setEditingTitleAndDesc(true)}
                  >
                    Edit Title and Desc
                  </Button>
                )}

                <Button type="button" onClick={() => void saveCustomerIssue()}>
                  Update Issue
                </Button>

                {!editingTitleAndDesc && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => void deleteIssue()}
                  >
                    Delete Issue
                  </Button>
                )}

                <Button type="button" onClick={() => void updateSubscription()}>
                  {subscribed ? 'Unsubscribe' : 'Subscribe'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ display: 'flex', gap: 16 }}>
              <div style={{ flexGrow: 1 }}>
                {nextAction && nextAction !== 'done' && (
                  <p style={{ fontSize: '24px' }}>
                    <b>Next Action:</b>{' '}
                    {CUSTOMER_ISSUE_NEXT_ACTIONS[nextAction]}
                  </p>
                )}
                <Card.Title style={{ display: 'flex' }}>
                  <Link
                    to={AdminRoutes.CUSTOMERS + '/' + customerIssue.customerID}
                  >
                    {customerIssue.customerName}
                  </Link>
                  <div
                    style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}
                  >
                    <Button
                      type="button"
                      onClick={() =>
                        void quickUpdate({
                          lastTouch: new Date().toISOString(),
                        })
                      }
                    >
                      Communicated with customer
                    </Button>
                    {customerIssue.communicationStatus === 'none' && (
                      <Button
                        type="button"
                        onClick={() =>
                          void quickUpdate({
                            communicationStatus: 'request_acked',
                          })
                        }
                      >
                        Request was acknowledged
                      </Button>
                    )}
                    {customerIssue.decision === 'pending' && (
                      <>
                        <Button
                          type="button"
                          onClick={() =>
                            void quickUpdate({ decision: 'accepted' })
                          }
                          variant="success"
                        >
                          Accept request
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            void quickUpdate({ decision: 'rejected' })
                          }
                          variant="danger"
                        >
                          Reject request
                        </Button>
                      </>
                    )}
                    {customerIssue.decision === 'accepted' && (
                      <Button
                        type="button"
                        onClick={() => void quickUpdate({ decision: 'done' })}
                      >
                        Task completed
                      </Button>
                    )}
                    {customerIssue.decision !== 'pending' &&
                      customerIssue.communicationStatus === 'request_acked' && (
                        <Button
                          type="button"
                          onClick={() =>
                            void quickUpdate({
                              communicationStatus: 'decision_sent',
                            })
                          }
                        >
                          Decision was sent
                        </Button>
                      )}
                    {customerIssue.communicationStatus === 'decision_sent' && (
                      <Button
                        type="button"
                        onClick={() =>
                          void quickUpdate({
                            communicationStatus: 'decision_acked',
                          })
                        }
                      >
                        Customer acknowledged decision
                      </Button>
                    )}
                  </div>
                </Card.Title>
                <Card>
                  <Accordion defaultActiveKey="0">
                    <Accordion.Toggle eventKey="0" as={Card.Header}>
                      Issue Details
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                      <Card.Body>
                        <CRTInputGroup
                          label="Description"
                          formInput={
                            editingTitleAndDesc ? (
                              <Form.Control
                                placeholder="Add more details here"
                                as="textarea"
                                value={customerIssue.body}
                                onChange={(event) =>
                                  updateCustomerIssue(
                                    'body',
                                    event?.target.value,
                                  )
                                }
                                style={{
                                  whiteSpace: 'break-spaces',
                                  height: 200,
                                }}
                              />
                            ) : (
                              <InputGroup.Text
                                style={{
                                  whiteSpace: 'break-spaces',
                                  height: 200,
                                  overflow: 'auto',
                                }}
                              >
                                <div style={{ textAlign: 'left' }}>
                                  {customerIssue.body
                                    .split('\n')
                                    .map((line, i) => (
                                      <Linkify
                                        options={{
                                          target: '_blank',
                                        }}
                                        tagName="p"
                                        key={i}
                                      >
                                        {line}
                                      </Linkify>
                                    ))}
                                </div>
                              </InputGroup.Text>
                            )
                          }
                        />
                        <div
                          style={{
                            display: 'flex',
                            gap: 16,
                          }}
                        >
                          <CRTInputGroup
                            label="Coming from"
                            formInput={
                              <Form.Control
                                as="select"
                                value={customerIssue.comingFrom}
                                onChange={(event) => {
                                  updateCustomerIssue(
                                    'comingFrom',
                                    event.target.value as AdminCRTComingFrom,
                                  );
                                }}
                              >
                                {Object.entries(
                                  CUSTOMER_ISSUE_REQ_CAME_FROM,
                                ).map(([value, label], index) => (
                                  <option value={value} key={index}>
                                    {label}
                                  </option>
                                ))}
                              </Form.Control>
                            }
                          />
                          <CRTInputGroup
                            label="Type"
                            formInput={
                              <Form.Control
                                as="select"
                                value={customerIssue.type}
                                onChange={(event) => {
                                  updateCustomerIssue(
                                    'type',
                                    event.target.value as AdminCRTIssueType,
                                  );
                                }}
                              >
                                {Object.entries(CUSTOMER_ISSUE_TYPES).map(
                                  ([value, label], index) => (
                                    <option key={index} value={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </Form.Control>
                            }
                          />

                          <CRTInputGroup
                            label="Priority"
                            formInput={
                              <Form.Control
                                as="select"
                                value={customerIssue.priority}
                                onChange={(event) => {
                                  updateCustomerIssue(
                                    'priority',
                                    event.target.value as AdminCRTPriority,
                                  );
                                }}
                              >
                                {Object.entries(CUSTOMER_ISSUE_PRIORITIES).map(
                                  ([value, label], index) => (
                                    <option key={index} value={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </Form.Control>
                            }
                          />
                        </div>
                      </Card.Body>
                    </Accordion.Collapse>
                  </Accordion>
                </Card>

                <div style={{ display: 'flex', gap: 16, marginTop: '1rem' }}>
                  <CRTInputGroup
                    label="Decision"
                    formInput={
                      <Form.Control
                        as="select"
                        value={customerIssue.decision}
                        onChange={(event) => {
                          updateCustomerIssue(
                            'decision',
                            event.target.value as AdminCRTDecision,
                          );
                        }}
                        className={
                          customerIssue.decision === 'pending'
                            ? `bg-danger text-white`
                            : `bg-success text-white`
                        }
                      >
                        {Object.entries(CUSTOMER_ISSUE_DECISIONS).map(
                          ([value, label], index) => (
                            <option key={index} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </Form.Control>
                    }
                  />

                  <CRTInputGroup
                    label="Communication Status"
                    formInput={
                      <Form.Control
                        as="select"
                        value={customerIssue.communicationStatus}
                        onChange={(event) => {
                          updateCustomerIssue(
                            'communicationStatus',
                            event.target.value as AdminCRTCommunicationStatus,
                          );
                        }}
                        className={
                          customerIssue.communicationStatus === 'none'
                            ? `bg-danger text-white`
                            : `bg-success text-white`
                        }
                      >
                        {Object.entries(CUSTOMER_ISSUE_COMM_STATUSES).map(
                          ([value, label], index) => (
                            <option key={index} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </Form.Control>
                    }
                  />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <CRTInputGroup
                    label="Last Communication"
                    formInput={
                      <input
                        style={{ height: '100%' }}
                        type="date"
                        value={
                          // The value should be just the date like 2023-01-23
                          // and we store the value with time appended
                          customerIssue.lastTouch
                            ? customerIssue.lastTouch.split('T')[0]
                            : ''
                        }
                        onChange={(event) => {
                          updateCustomerIssue('lastTouch', event.target.value);
                        }}
                      ></input>
                    }
                  />
                  <CRTInputGroup
                    label="Visibility"
                    formInput={
                      <Form.Control
                        as="select"
                        value={
                          customerIssue.externallyVisible ? 'show' : 'hide'
                        }
                        onChange={(event) => {
                          const externallyVisible =
                            event.target.value === 'show' ? true : false;
                          updateCustomerIssue(
                            'externallyVisible',
                            externallyVisible,
                          );
                        }}
                      >
                        {Object.entries(CUSTOMER_ISSUE_VISIBILITY).map(
                          ([value, label], index) => (
                            <option key={index} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </Form.Control>
                    }
                  />
                </div>
                <CRTInputGroup
                  label="Assignee"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.assignee ?? 'placeholder'}
                      onChange={(event) => {
                        updateCustomerIssue('assignee', event.target.value);
                      }}
                    >
                      <option value="placeholder" disabled>
                        Select your option
                      </option>
                      {adminPlatformUsersQueryResults &&
                        adminPlatformUsersQueryResults.adminPlatformUsers.map(
                          (obj, index) => (
                            <option key={index} value={obj.user.externalID}>
                              {obj.user.displayName}
                            </option>
                          ),
                        )}
                    </Form.Control>
                  }
                />

                <Card>
                  <Card.Header>
                    <h3>Issue History</h3>
                    {customerIssue.externallyVisible && (
                      <ButtonGroup
                        style={{ isolation: 'isolate' }}
                        toggle={true}
                      >
                        <ToggleButton
                          type="radio"
                          name="internal"
                          variant={
                            showInternalThread ? 'success' : 'outline-success'
                          }
                          value="internal"
                          checked={showInternalThread}
                          onChange={toggleThreadView}
                        >
                          Internal
                        </ToggleButton>
                        <ToggleButton
                          type="radio"
                          name="external"
                          variant={
                            !showInternalThread ? 'danger' : 'outline-danger'
                          }
                          value="external"
                          checked={!showInternalThread}
                          onChange={toggleThreadView}
                        >
                          Public
                        </ToggleButton>
                      </ButtonGroup>
                    )}
                  </Card.Header>
                  <Card.Body className={classes.changelog}>
                    {showInternalThread ? (
                      <InternalThreadAndHistory
                        issue={customerIssue}
                        classes={classes}
                        changes={issueChanges}
                      />
                    ) : (
                      <CustomerThread id={id} />
                    )}
                  </Card.Body>
                </Card>
              </div>
            </Card.Body>
          </Form>
        </Card>
      </PresenceObserver>
    </>
  );
}
