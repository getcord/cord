import { useCallback, useMemo, useState } from 'react';
import { Form, Button, Card, Col } from 'react-bootstrap';
import type { AdminCRTCustomerIssue, UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { useSelectQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { CRTInputGroup } from 'external/src/entrypoints/admin/components/crt/CRTInputGroup.tsx';
import {
  CUSTOMER_ISSUE_COMM_STATUSES,
  CUSTOMER_ISSUE_DECISIONS,
  CUSTOMER_ISSUE_TYPES,
  CUSTOMER_ISSUE_PRIORITIES,
  CUSTOMER_ISSUE_REQ_CAME_FROM,
  CUSTOMER_ISSUE_VISIBILITY,
} from 'external/src/entrypoints/admin/pages/Issue.tsx';

const FORM_EMPTY_STATE: AdminCRTCustomerIssue = {
  customerID: 'placeholder',
  title: '',
  body: '',
  comingFrom: 'us',
  decision: 'pending',
  communicationStatus: 'none',
  type: 'request',
  priority: 'low',
  externallyVisible: false,
  assignee: 'placeholder',
};

type Props = {
  customerID?: UUID;
  title?: string;
  fieldsToHide?: (keyof AdminCRTCustomerIssue)[];
  onCreateIssue: (customerIssue: AdminCRTCustomerIssue) => unknown;
  assignees?: { displayName: string; externalID: string | null }[];
};

export function CreateCRTIssue({
  title,
  customerID,
  fieldsToHide = [],
  onCreateIssue,
  assignees,
}: Props) {
  const customerIssueInitialState = customerID
    ? { ...FORM_EMPTY_STATE, customerID }
    : FORM_EMPTY_STATE;
  const [customerIssue, setCustomerIssue] = useState<AdminCRTCustomerIssue>(
    customerIssueInitialState,
  );

  const fieldsToHideSet = useMemo(() => new Set(fieldsToHide), [fieldsToHide]);

  const { data: customerData } = useSelectQuery({
    variables: {
      query: DataTableQueries.VERIFIED_CUSTOMERS,
      parameters: {},
    },
    skip: !!customerID,
  });

  const typedCustomerData = useMemo(() => {
    if (!customerData) {
      return [];
    }

    return customerData.select.map((customer) => {
      if (
        'id' in customer &&
        typeof customer.id === 'string' &&
        'name' in customer &&
        typeof customer.name === 'string'
      ) {
        const value = { id: customer.id, name: customer.name };
        return value;
      }
      throw Error('Customer data incorrectly formatted');
    });
  }, [customerData]);

  const updateCustomerIssue = useCallback(
    (
      field: keyof AdminCRTCustomerIssue,
      value: AdminCRTCustomerIssue[keyof AdminCRTCustomerIssue],
    ) => {
      setCustomerIssue((prevValue) => ({ ...prevValue, [field]: value }));
    },
    [],
  );

  const createNewIssue = useCallback(async () => {
    if (customerIssue.customerID === 'placeholder') {
      return;
    }

    onCreateIssue(customerIssue);
    setCustomerIssue(FORM_EMPTY_STATE);
  }, [customerIssue, onCreateIssue]);

  return (
    <Card>
      {title && (
        <Card.Header>
          <b>{title}</b>
        </Card.Header>
      )}
      <Card.Body>
        <Form>
          {!fieldsToHideSet.has('customerID') && (
            <CRTInputGroup
              label="Customer ID"
              formInput={
                <Form.Control
                  as="select"
                  value={customerIssue.customerID}
                  onChange={(event) => {
                    updateCustomerIssue('customerID', event.target.value);
                  }}
                  disabled={!!customerID}
                >
                  <option value="placeholder" disabled>
                    Select your option
                  </option>
                  {typedCustomerData &&
                    typedCustomerData.map((customer, index) => {
                      return (
                        <option key={index} value={customer.id}>
                          {customer.name}
                        </option>
                      );
                    })}
                </Form.Control>
              }
            />
          )}
          {!fieldsToHideSet.has('title') && (
            <CRTInputGroup
              label="Issue title"
              formInput={
                <Form.Control
                  placeholder="Title"
                  value={customerIssue.title}
                  onChange={(event) =>
                    updateCustomerIssue('title', event?.target.value)
                  }
                />
              }
            />
          )}
          {!fieldsToHideSet.has('body') && (
            <CRTInputGroup
              label="Description"
              formInput={
                <Form.Control
                  placeholder="Add more details here"
                  as="textarea"
                  value={customerIssue.body}
                  onChange={(event) =>
                    updateCustomerIssue('body', event?.target.value)
                  }
                  style={{
                    whiteSpace: 'break-spaces',
                    height: 200,
                  }}
                />
              }
            />
          )}
          <Form.Row>
            {!fieldsToHideSet.has('comingFrom') && (
              <Col>
                <CRTInputGroup
                  label="Coming from"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.comingFrom}
                      onChange={(event) => {
                        updateCustomerIssue('comingFrom', event.target.value);
                      }}
                    >
                      {Object.entries(CUSTOMER_ISSUE_REQ_CAME_FROM).map(
                        ([value, label], index) => (
                          <option value={value} key={index}>
                            {label}
                          </option>
                        ),
                      )}
                    </Form.Control>
                  }
                />
              </Col>
            )}

            {!fieldsToHideSet.has('type') && (
              <Col>
                <CRTInputGroup
                  label="Type"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.type}
                      onChange={(event) => {
                        updateCustomerIssue('type', event.target.value);
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
              </Col>
            )}

            {!fieldsToHideSet.has('priority') && (
              <Col>
                <CRTInputGroup
                  label="Priority"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.priority}
                      onChange={(event) => {
                        updateCustomerIssue('priority', event.target.value);
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
              </Col>
            )}
          </Form.Row>
          <Form.Row>
            {!fieldsToHideSet.has('decision') && (
              <Col>
                <CRTInputGroup
                  label="Decision"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.decision}
                      onChange={(event) => {
                        updateCustomerIssue('decision', event.target.value);
                      }}
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
              </Col>
            )}

            {!fieldsToHideSet.has('communicationStatus') && (
              <Col>
                <CRTInputGroup
                  label="Communication Status"
                  formInput={
                    <Form.Control
                      as="select"
                      value={customerIssue.communicationStatus}
                      onChange={(event) => {
                        updateCustomerIssue(
                          'communicationStatus',
                          event.target.value,
                        );
                      }}
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
              </Col>
            )}
          </Form.Row>

          {!fieldsToHideSet.has('assignee') && assignees && (
            <CRTInputGroup
              label="Assignee"
              formInput={
                <Form.Control
                  as="select"
                  value={customerIssue.assignee}
                  onChange={(event) => {
                    updateCustomerIssue('assignee', event.target.value);
                  }}
                >
                  <option value="placeholder" disabled>
                    Select your option
                  </option>
                  {assignees.map((assignee, index) => (
                    // All of our admin users have external ids
                    <option key={index} value={assignee.externalID!}>
                      {assignee.displayName}
                    </option>
                  ))}
                </Form.Control>
              }
            />
          )}

          {!fieldsToHideSet.has('externallyVisible') && (
            <CRTInputGroup
              label="Visibility"
              formInput={
                <Form.Control
                  as="select"
                  value={customerIssue.externallyVisible ? 'show' : 'hide'}
                  onChange={(event) => {
                    const externallyVisible =
                      event.target.value === 'show' ? true : false;
                    updateCustomerIssue('externallyVisible', externallyVisible);
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
          )}

          <Button type="button" onClick={() => void createNewIssue()}>
            Create Issue
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
