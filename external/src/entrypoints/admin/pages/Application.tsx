import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import {
  Form,
  InputGroup,
  Button,
  Spinner,
  Card,
  Image,
  Table,
} from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';
import type {
  CustomEmailTemplate,
  CustomLinks,
  UpdateApplicationMutationVariables,
  CustomNUXInput,
  ApplicationEnvironment,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import {
  useApplicationQuery,
  useDeleteApplicationCustomS3BucketMutation,
  useCreateApplicationCustomS3BucketMutation,
  useUpdateApplicationMutation,
  useUpdateCustomS3BucketSecretMutation,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import S3BucketUpdateView from 'external/src/entrypoints/admin/components/S3BucketUpdateView.tsx';
import S3BucketFullEditingView from 'external/src/entrypoints/admin/components/S3BucketFullEditingView.tsx';
import { createDefaultCustomNUX } from 'external/src/components/util.ts';
import { Sizes } from 'common/const/Sizes.ts';
import TabConsoleUsers from 'external/src/entrypoints/admin/components/CustomerUserCard.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { CopyButton } from 'external/src/entrypoints/admin/components/CopyButton.tsx';
import type { WebhookPayloads } from '@cord-sdk/types';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';

function emoji(value: number | boolean) {
  if (typeof value === 'number') {
    if (value <= 0) {
      return '❌';
    } else if (value === 1) {
      return '🟡';
    } else {
      return '✅';
    }
  } else {
    return value ? '✅' : '❌';
  }
}

function emojiGivenThreshold(value: number, threshold: number) {
  if (value < threshold) {
    return '❌';
  } else {
    return '✅';
  }
}

export function Application() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const { data, loading, refetch } = useApplicationQuery({ variables: { id } });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [updateApplication] = useUpdateApplicationMutation();
  const [name, setName] = useState('');
  const [links, setLinks] = useState<CustomLinks>({
    learnMore: undefined,
    leaveFeedback: undefined,
    upgradePlan: undefined,
  });
  const [environment, setEnvironment] =
    useState<ApplicationEnvironment>('production');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [email, setEmail] = useState<CustomEmailTemplate>({
    partnerName: '',
    imageURL: '',
    sender: undefined,
    logoConfig: undefined,
  });
  const [writeKey, setWriteKey] = useState<string | null>(null);
  const [iconURL, setIconURL] = useState<string | null>(null);
  const [NUX, setNUX] = useState<CustomNUXInput>({
    initialOpen: {
      title: null,
      text: null,
      imageURL: null,
    },
    welcome: {
      title: null,
      text: null,
      imageURL: null,
    },
  });
  const [redirectURI, setRedirectURI] = useState<string>('');
  const [eventWebhookURL, setEventWebhookURL] = useState<string>('');
  const [eventWebhookSubscriptions, setEventWebhookSubscriptions] = useState<
    string[]
  >([]);

  type WebhookTypes = keyof WebhookPayloads;
  const webhooks: { type: WebhookTypes; description: string }[] = [
    {
      type: 'thread-message-added',
      description: 'A new Cord message was added',
    },
    {
      type: 'notification-created',
      description: 'A new Cord notification was created',
    },
  ];

  function handleSubsCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    setEventWebhookSubscriptions((prevSubscriptions) => {
      if (!prevSubscriptions.includes(e.target.value)) {
        return [...prevSubscriptions, e.target.value];
      } else {
        return prevSubscriptions.filter((sub) => sub !== e.target.value);
      }
    });
  }

  useEffect(() => {
    if (data && data.application) {
      setEmailEnabled(data.application.enableEmailNotifications);
      if (data.application.customEmailTemplate) {
        setEmail(data.application.customEmailTemplate);
      }
      setName(data.application.name);
      if (data.application.customLinks) {
        setLinks(data.application.customLinks);
      }
      setWriteKey(data.application.segmentWriteKey ?? null);
      setIconURL(data.application.iconURL ?? null);
      if (data.application.customNUX) {
        setNUX(data.application.customNUX);
      }
      if (data.application.redirectURI) {
        setRedirectURI(data.application.redirectURI);
      }
      if (data.application) {
        setEnvironment(data.application.environment);
      }
      if (data.application.eventWebhookURL) {
        setEventWebhookURL(data.application.eventWebhookURL);
      }
      if (data.application.eventWebhookSubscriptions) {
        setEventWebhookSubscriptions(
          data.application.eventWebhookSubscriptions,
        );
      }
    }
  }, [data]);

  const [deleteBucket] = useDeleteApplicationCustomS3BucketMutation();

  const deleteBucketMutator = useCallback(
    async (applicationID: UUID) => {
      const result = await deleteBucket({
        variables: { applicationID },
      });

      if (result.data?.deleteApplicationCustomS3Bucket.success) {
        void refetch();
      }
    },
    [deleteBucket, refetch],
  );

  const [createBucket] = useCreateApplicationCustomS3BucketMutation();
  const createBucketMutator = useCallback(
    async (
      applicationID: UUID,
      bucket: string,
      region: string,
      accessKeyID: string,
      accessKeySecret: string,
    ) => {
      const result = await createBucket({
        variables: {
          applicationID,
          bucket,
          region,
          accessKeyID,
          accessKeySecret,
        },
      });

      if (result.data?.createApplicationCustomS3Bucket.success) {
        void refetch();
      }
    },
    [createBucket, refetch],
  );

  const [updateSecret] = useUpdateCustomS3BucketSecretMutation();

  const updateBucketMutator = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    async (id: UUID, keyID: string, keySecret: string) => {
      const result = await updateSecret({
        variables: { id, keyID, keySecret },
      });

      if (result.data?.updateCustomS3BucketAccessKey.success) {
        void refetch();
      }
    },
    [updateSecret, refetch],
  );

  const [editingMode, setEditingMode] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  const defaultCustomNUX = createDefaultCustomNUX(name);

  if (loading || !data?.application) {
    return <Spinner animation={'border'} />;
  }

  const deploymentInfo = data.application.deploymentInfo;

  return (
    <>
      <Helmet>
        <title>Cord Admin - What Appened</title>
      </Helmet>

      <Card>
        <Card.Header as="h1">{data.application.name}</Card.Header>
        <Card.Body>
          <p>
            <b>Application ID: </b> {id}
            <CopyButton value={id} />
            <br />
            <b>Secret: </b>{' '}
            {data?.application?.sharedSecret ?? (
              <Spinner animation={'border'} />
            )}
            <CopyButton value={data?.application?.sharedSecret} />
            <br />
            <b>Customer: </b>{' '}
            <Link
              to={AdminRoutes.CUSTOMERS + '/' + data.application.customerID}
            >
              {data.application.customerID ?? <Spinner animation={'border'} />}
            </Link>
            <CopyButton value={data.application.customerID} />
          </p>
          <p>
            <b>
              Setup Progress (Step done at least once since the creation of the
              app):
            </b>
            <Table bordered style={{ textAlign: 'center' }}>
              <tr>
                <th>1. Added a component</th>
                <th>2. Added a custom location</th>
                <th>3. Customized CSS</th>
                <th>4. Generated client auth token</th>
                <th>5. Synced a user</th>
                <th>6. Synced an org</th>
                <th>7. Synced multiple users (&gt;=10)</th>
                <th>8. Synced multiple orgs (&gt;=10)</th>
              </tr>
              <tr>
                <td>
                  {emojiGivenThreshold(
                    deploymentInfo.componentsInitializedAllTime.length,
                    1,
                  )}
                </td>
                <td>
                  {emojiGivenThreshold(
                    deploymentInfo.customLocationsAllTime,
                    1,
                  )}
                </td>
                <td>🤷</td>
                <td>
                  {emojiGivenThreshold(
                    deploymentInfo.componentsInitializedAllTime.length,
                    1,
                  )}
                </td>
                <td>
                  {emojiGivenThreshold(deploymentInfo.usersSyncedAllTime, 1)}
                </td>
                <td>
                  {emojiGivenThreshold(deploymentInfo.orgsSyncedAllTime, 1)}
                </td>
                <td>
                  {emojiGivenThreshold(deploymentInfo.usersSyncedAllTime, 10)}
                </td>
                <td>
                  {emojiGivenThreshold(deploymentInfo.orgsSyncedAllTime, 10)}
                </td>
              </tr>
            </Table>
          </p>
          <Card.Title>Feature Usage — Last 7 Days</Card.Title>
          <p>
            <Table bordered style={{ textAlign: 'center' }}>
              <tr>
                <th>Redirect URI</th>
                <th>Custom Locations</th>
              </tr>
              <tr>
                <td>{emoji(!!data.application.redirectURI)}</td>
                <td>{emoji(deploymentInfo.customLocations)}</td>
              </tr>
            </Table>
          </p>
          <p>
            <a
              href={`https://monitoring.cord.com/d/uTh6wYI4z/application-status?orgId=1&var-application=${id}`}
              target="_blank"
              rel="noreferrer"
            >
              Detailed Usage Dashboard
            </a>
          </p>
          <Card.Title>Edit Application</Card.Title>
          <Form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            onSubmit={async (e) => {
              e.preventDefault();

              let variables: UpdateApplicationMutationVariables = {
                id: id,
                name: undefined,
                customEmailTemplate: email,
                enableEmailNotifications: emailEnabled,
                customLinks: links,
                segmentWriteKey: writeKey,
                iconURL,
                customNUX: NUX,
                environment,
                redirectURI,
                eventWebhookURL,
                eventWebhookSubscriptions,
              };
              if (name !== '') {
                variables = { ...variables, name: name };
              }
              const result = await updateApplication({ variables });
              if (result.data?.updateApplication.success === false) {
                if (result.data?.updateApplication.failureDetails?.message) {
                  setErrorMessage(
                    `Changes not saved. ${result.data.updateApplication.failureDetails.message}`,
                  );
                } else {
                  setErrorMessage(
                    'An unexpected error has occurred. Please try again.',
                  );
                }
              }
              if (
                !result.errors &&
                result.data?.updateApplication.success === true
              ) {
                location.reload();
              }
            }}
          >
            <Form.Group>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Name</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Customer Environment Type</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  as="select"
                  value={environment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEnvironment(e.target.value as ApplicationEnvironment)
                  }
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="sample" disabled>
                    Sample
                  </option>
                  <option value="sampletoken" disabled>
                    Sample Token
                  </option>
                </Form.Control>
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Icon URL</InputGroup.Text>
                  {iconURL && (
                    <InputGroup.Text>
                      <img
                        src={iconURL}
                        width={Sizes.DEFAULT_ICON_SIZE}
                        height={Sizes.DEFAULT_ICON_SIZE}
                      />
                    </InputGroup.Text>
                  )}
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={iconURL || undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIconURL(e.target.value || null)
                  }
                />
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Segment Write Key</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={writeKey ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWriteKey(e.target.value)
                  }
                />
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <Form.Label>Custom Links</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Leave Feedback</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={links.leaveFeedback ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLinks({
                      ...links,
                      leaveFeedback: e.target.value,
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Learn More</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={links.learnMore ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLinks({
                      ...links,
                      learnMore: e.target.value,
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Upgrade Plan</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={links.upgradePlan ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLinks({
                      ...links,
                      upgradePlan: e.target.value,
                    })
                  }
                />
              </InputGroup>
            </Form.Group>
            <Form.Group>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Enable Email Notifications</InputGroup.Text>
                </InputGroup.Prepend>
                <InputGroup.Checkbox
                  checked={emailEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmailEnabled(e.target.checked)
                  }
                />
              </InputGroup>
            </Form.Group>
            <Form.Group>
              <Form.Label>Custom Email Template</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Partner Name</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={email.partnerName ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail({
                      ...email,
                      partnerName: e.target.value,
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Image URL</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={email.imageURL ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail({
                      ...email,
                      imageURL: e.target.value,
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Sender</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={email.sender ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail({
                      ...email,
                      sender: e.target.value,
                    })
                  }
                />
              </InputGroup>
              {email.sender &&
                email.sender.includes('@') &&
                !email.sender.includes('@cord.fyi') && (
                  <p>
                    Are you using a white-label (non-@cord.fyi) sender address?
                    If so, make sure you have added the domain of the email
                    address to our Sendgrid account. (Instructions are{' '}
                    <a href="https://www.notion.so/getcord/Case-study-adding-white-label-email-to-ohffs-io-8eb9326214a748818e07a4311f93ab63">
                      here
                    </a>
                    .)
                  </p>
                )}
              <Form.Text>Notifications</Form.Text>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Redirect URI</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="url"
                  value={redirectURI}
                  placeholder="https://cord.com"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRedirectURI(e.target.value)
                  }
                />
              </InputGroup>
            </Form.Group>
            <Form.Group>
              <Form.Label>Custom NUX</Form.Label>
              <Form.Text>Initial Open</Form.Text>
              <InputGroup>
                <InputGroup.Text>Title</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={defaultCustomNUX.initialOpen.title}
                  value={NUX.initialOpen?.title ?? undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      initialOpen: {
                        ...NUX.initialOpen!,
                        title: e.target.value || null,
                      },
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Text</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  placeholder={defaultCustomNUX.initialOpen.text}
                  value={NUX.initialOpen?.text ?? undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      initialOpen: {
                        ...NUX.initialOpen!,
                        text: e.target.value || null,
                      },
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Image URL</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={
                    NUX.initialOpen?.imageURL === ''
                      ? 'No image will be shown'
                      : 'Default gif will be shown'
                  }
                  value={NUX.initialOpen?.imageURL ?? undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      initialOpen: {
                        ...NUX.initialOpen!,
                        imageURL: e.target.value || null,
                      },
                    })
                  }
                />
                <InputGroup.Text>Use no image</InputGroup.Text>
                <InputGroup.Checkbox
                  checked={NUX.initialOpen?.imageURL === ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      initialOpen: {
                        ...NUX.initialOpen!,
                        imageURL: e.target.checked ? '' : null,
                      },
                    })
                  }
                />
              </InputGroup>
              {NUX.initialOpen?.imageURL !== '' && (
                <Image
                  src={
                    NUX?.initialOpen?.imageURL ??
                    defaultCustomNUX.initialOpen.imageURL
                  }
                  thumbnail
                  // Size is what it actually takes up in the NUX
                  width={'328px'}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              )}
              <Form.Text>Welcome</Form.Text>
              <InputGroup>
                <InputGroup.Text>Title</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={defaultCustomNUX.welcome.title}
                  value={NUX.welcome?.title || undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      welcome: {
                        ...NUX.welcome!,
                        title: e.target.value || null,
                      },
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Text</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  placeholder={defaultCustomNUX.welcome.text}
                  value={NUX.welcome?.text || undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      welcome: {
                        ...NUX.welcome!,
                        text: e.target.value || null,
                      },
                    })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Image URL</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={
                    NUX.welcome?.imageURL === ''
                      ? 'No image will be shown'
                      : 'Default gif will be shown'
                  }
                  value={NUX.welcome?.imageURL ?? undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      welcome: {
                        ...NUX.welcome!,
                        imageURL: e.target.value || null,
                      },
                    })
                  }
                />
                <InputGroup.Text>Use no image</InputGroup.Text>
                <InputGroup.Checkbox
                  checked={NUX.welcome?.imageURL === ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNUX({
                      ...NUX,
                      welcome: {
                        ...NUX.welcome!,
                        imageURL: e.target.checked ? '' : null,
                      },
                    })
                  }
                />
              </InputGroup>
              {NUX.welcome?.imageURL !== '' && (
                <Image
                  src={
                    NUX?.welcome?.imageURL ?? defaultCustomNUX.welcome.imageURL
                  }
                  thumbnail
                  // Size is what it actually takes up in the NUX
                  width={'304px'}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Event Webhook URL</Form.Label>
              {/* TODO - verification? */}
              <InputGroup>
                <InputGroup.Text>URL</InputGroup.Text>
                <Form.Control
                  type="url"
                  value={eventWebhookURL ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEventWebhookURL(e.target.value);
                    setErrorMessage(null);
                  }}
                />
              </InputGroup>
              <Form.Label>Choose which events to subscribe to</Form.Label>
              <Table striped>
                <thead>
                  <th>Event Type</th>
                  <th>Description</th>
                  <th></th>
                  <th></th>
                  {/* empty table column so checkbox is not on the edge */}
                </thead>
                <tbody>
                  {webhooks.map(({ type, description }) => {
                    return (
                      <tr key={type}>
                        <td>
                          <a
                            href={`https://docs.cord.com/reference/events-webhook/events/${type}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {type}
                          </a>
                        </td>
                        <td>{description}</td>
                        <td>
                          <input
                            type="checkbox"
                            value={type}
                            checked={eventWebhookSubscriptions.includes(type)}
                            onChange={handleSubsCheckbox}
                          ></input>
                        </td>
                        <td></td>
                        {/* empty table column so checkbox is not on the edge */}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Form.Group>
            <Button type={'submit'}>Update</Button>
            <SubmitFormResultMessage
              errorMessage={errorMessage}
              clearErrorMessage={() => setErrorMessage(null)}
              successMessage={successMessage}
              clearSuccessMessage={() => setSuccessMessage(null)}
              warningMessage={warningMessage}
              clearWarningMessage={() => setWarningMessage(null)}
            />
          </Form>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>S3 Bucket</Card.Header>
        <Card.Body>
          {data?.application.customS3Bucket ? (
            <div>
              <div>Bucket Name: {data.application.customS3Bucket.name}</div>
              <div>Bucket Region: {data.application.customS3Bucket.region}</div>
              <Button
                onClick={() => {
                  setReplaceMode(true);
                  setEditingMode(false);
                }}
              >
                Update Bucket Secret
              </Button>{' '}
              <Button
                onClick={() => {
                  setEditingMode(true);
                  setReplaceMode(false);
                }}
              >
                Replace Bucket
              </Button>{' '}
              {/* eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one! */}
              <Button variant="danger" onClick={() => deleteBucketMutator(id)}>
                Remove Bucket
              </Button>
              {replaceMode && (
                <S3BucketUpdateView
                  s3BucketId={data.application.customS3Bucket.id}
                  onSave={updateBucketMutator}
                  onClose={() => setReplaceMode(false)}
                />
              )}
            </div>
          ) : (
            <div>
              No S3 Bucket defined for this application.
              <Button onClick={() => setEditingMode(true)}>
                Create Bucket
              </Button>
            </div>
          )}
          {editingMode && (
            <S3BucketFullEditingView
              id={id}
              onSave={createBucketMutator}
              onClose={() => setEditingMode(false)}
            />
          )}
        </Card.Body>
      </Card>
      <TabConsoleUsers id={data?.application?.customerID} />
    </>
  );
}
