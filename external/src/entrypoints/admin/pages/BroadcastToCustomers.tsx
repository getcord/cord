import type { ChangeEventHandler } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Col,
  Dropdown,
  Form,
} from 'react-bootstrap';
import type {
  CustomerSlackChannelQueryResult,
  CustomerSlackMessageType,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import {
  useCustomerSlackChannelQuery,
  useSendSlackMessageToCustomersMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { CORD_UPDATES_SLACK_CHANNEL_DETAILS } from 'common/util/admin.ts';

const SELECT_ALL_CUSTOMERS_ID = 'select-all';

export function BroadcastToCustomers() {
  const { data, loading } = useCustomerSlackChannelQuery();

  const [sendSlackMessageToCustomers] =
    useSendSlackMessageToCustomersMutation();

  const [customerData, setCustomerData] =
    useState<CustomerSlackChannelQueryResult['customerSlackChannels']>();

  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(),
  );

  const [message, setMessage] = useState<string>();

  const [successMessage, setSuccessMessage] = useState<string>();

  const [errorMessage, setErrorMessage] = useState<string>();

  const disabledButton = !message || message.length === 0;

  useEffect(() => {
    if (data && data.customerSlackChannels && !loading) {
      setCustomerData(data.customerSlackChannels);
    }
  }, [data, loading]);

  const toggleSelectAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedCustomers(
          new Set([
            ...(customerData?.map((customer) => customer.slackChannelName) ??
              []),
            CORD_UPDATES_SLACK_CHANNEL_DETAILS.slackChannelName,
          ]),
        );
      } else {
        setSelectedCustomers(new Set());
      }
    },
    [customerData],
  );

  const onCustomerChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const channelName = event.target.value;
      const checked = event.target.checked;
      setSelectedCustomers((prev) => {
        const newSelectedCustomersSet = new Set(prev);
        if (checked) {
          newSelectedCustomersSet.add(channelName);
        } else {
          newSelectedCustomersSet.delete(channelName);
        }
        return newSelectedCustomersSet;
      });
    },
    [],
  );

  const onSelectAllChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      toggleSelectAll(event.target.checked);
    },
    [toggleSelectAll],
  );

  const customerList = useMemo(() => {
    const customerInputs = customerData?.map((customer) => (
      <Form.Check id={customer.id} name={customer.name} key={customer.id}>
        <Form.Check.Input
          value={customer.slackChannelName}
          onChange={onCustomerChange}
          checked={selectedCustomers.has(customer.slackChannelName)}
        />
        <Form.Check.Label>{customer.name}</Form.Check.Label>
      </Form.Check>
    ));

    const totalNumChannels = (customerData?.length ?? 0) + 1; // includes our cord test channel

    return (
      <Form.Group>
        <Form.Label>Select customers</Form.Label>
        <Card style={{ maxHeight: 500, overflow: 'auto' }}>
          <Card.Body>
            <Form.Group>
              <Form.Check
                id={SELECT_ALL_CUSTOMERS_ID}
                name="Select All"
                key={SELECT_ALL_CUSTOMERS_ID}
              >
                <Form.Check.Input
                  onChange={onSelectAllChange}
                  checked={selectedCustomers.size === totalNumChannels}
                />
                <Form.Check.Label>
                  Select All Customer Channels
                </Form.Check.Label>
              </Form.Check>

              <Form.Check
                id={CORD_UPDATES_SLACK_CHANNEL_DETAILS.id}
                name={CORD_UPDATES_SLACK_CHANNEL_DETAILS.name}
                key={CORD_UPDATES_SLACK_CHANNEL_DETAILS.id}
              >
                <Form.Check.Input
                  value={CORD_UPDATES_SLACK_CHANNEL_DETAILS.slackChannelName}
                  onChange={onCustomerChange}
                  checked={selectedCustomers.has(
                    CORD_UPDATES_SLACK_CHANNEL_DETAILS.slackChannelName,
                  )}
                />
                <Form.Check.Label>Cord Updates Test Channel</Form.Check.Label>
              </Form.Check>
              <hr />
              {customerInputs}
            </Form.Group>
          </Card.Body>
        </Card>
      </Form.Group>
    );
  }, [customerData, onCustomerChange, onSelectAllChange, selectedCustomers]);

  const handleOnSubmit = useCallback(
    async (type: CustomerSlackMessageType) => {
      try {
        if (!message) {
          throw new Error('Message is empty');
        }

        if (type === 'customer' && selectedCustomers.size === 0) {
          throw new Error('Customers have not been selected');
        }

        const response = await sendSlackMessageToCustomers({
          variables: {
            type,
            message: message,
            customers: [...selectedCustomers],
          },
        });

        if (response.data?.sendSlackMessageToCustomers.success) {
          setSuccessMessage('Message successfully sent');
        } else {
          throw new Error(
            `Something went wrong: ${response.data?.sendSlackMessageToCustomers.failureDetails?.message}`,
          );
        }

        if (type === 'customer') {
          // clear the message when it has been sent successfully
          setMessage('');
          toggleSelectAll(false);
        }
      } catch (error) {
        let submitErrorMessage = 'Something went wrong';
        if (error instanceof Error) {
          submitErrorMessage = error.message;
        }
        setErrorMessage(submitErrorMessage);
      }
    },
    [message, selectedCustomers, sendSlackMessageToCustomers, toggleSelectAll],
  );
  return (
    <>
      <Helmet>
        <title>Cord Admin - Broadcast</title>
      </Helmet>
      <Card>
        <Card.Header>Broadcast to Customers in Slack</Card.Header>
        <Card.Body>
          <Form.Row>
            <Col>{customerList}</Col>
            <Col>
              <Form.Group>
                <Form.Label>Message:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Markdown friendly..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </Form.Group>
              <Dropdown as={ButtonGroup} style={{ marginBottom: '1em' }}>
                <Button
                  onClick={() => void handleOnSubmit('test')}
                  disabled={disabledButton}
                  variant="success"
                >
                  Send test message to myself
                </Button>
                <Dropdown.Toggle
                  disabled={disabledButton || selectedCustomers.size === 0}
                  variant="outline-success"
                >
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => void handleOnSubmit('customer')}
                      disabled={disabledButton || selectedCustomers.size === 0}
                    >
                      Send to customers
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Toggle>
              </Dropdown>

              {successMessage && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setSuccessMessage(undefined)}
                >
                  {successMessage}
                </Alert>
              )}
              {errorMessage && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setErrorMessage(undefined)}
                >
                  {errorMessage}
                </Alert>
              )}
            </Col>
          </Form.Row>
        </Card.Body>
      </Card>
    </>
  );
}
