import { useCallback, useLayoutEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { Card, Form, InputGroup } from 'react-bootstrap';

import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import {
  useSlackChannelsForConsoleQuery,
  useUpdateSupportBotMutation,
  useRemoveSlackSupportOrgMutation,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { useImageField } from 'external/src/entrypoints/console/hooks/useImageField.tsx';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { CustomButton } from 'external/src/entrypoints/console/components/CustomButton.tsx';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { ConnectSlackModal } from 'external/src/entrypoints/console/components/ConnectSlackModal.tsx';
import { Styles } from 'common/const/Styles.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Errors } from 'common/const/Errors.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

const useStyles = createUseStyles({
  overlay: {
    backgroundColor: Styles.MODAL_BACKGROUND_COLOR_LIGHT,
    borderRadius: '0.25rem', // Match container
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  explainerText: {
    marginBottom: '0.25rem',
  },
});

export function ApplicationSupportChat() {
  const classes = useStyles();

  const {
    application,
    refetch: refetchApplication,
    id: appID,
  } = useContextThrowingIfNoProvider(ConsoleApplicationContext);

  const { logError, logEvent } = useLogger();

  const { data: slackChannelsData, refetch: refetchSlackChannels } =
    useSlackChannelsForConsoleQuery({ variables: { applicationID: appID! } });

  const [updateSupportBot] = useUpdateSupportBotMutation();
  const [removeSlackOrg] = useRemoveSlackSupportOrgMutation();

  const [supportUserName, setSupportUserName] = useState('');
  const [selectedSlackChannelID, setSelectedSlackChannelID] = useState<
    string | null
  >(null);

  const {
    imageURL,
    imageFieldElement,
    setInitialImageURLRef,
    uploadImageFile,
  } = useImageField({
    label: 'Support user avatar',
    tooltipContent:
      'The profile pic for your support user. Add an image URL or upload an image. The image will be shown as 24x24.',
    imageWidth: 24,
    imageHeight: 24,
    thumbnail: true,
    required: true,
    inlinePreview: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const appName = application?.name;
  const defaultSupportUserName = appName ? `${appName} support` : '';

  const [slackConnected, setSlackConnected] = useState(false);

  useLayoutEffect(() => {
    if (application) {
      const { supportBotInfo, supportSlackChannelID } = application;
      if (supportSlackChannelID) {
        setSelectedSlackChannelID(supportSlackChannelID);
      }
      if (supportBotInfo) {
        const { name, profilePictureURL } = supportBotInfo;
        setSupportUserName(name);
        setInitialImageURLRef.current(profilePictureURL);
      }
    }
  }, [application, setInitialImageURLRef]);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      const uploadedImageURL = await uploadImageFile(appID!, 'support-avatar');
      const profilePictureURL = uploadedImageURL ?? imageURL;
      if (!profilePictureURL || !selectedSlackChannelID) {
        logError(
          'Submitted support bot info without profilePictureURL or slackChannelID',
          { profilePictureURL, selectedSlackChannelID, applicationID: appID },
        );
        setErrorMessage('An unexpected error has occurred.');
        return;
      }
      const result = await updateSupportBot({
        variables: {
          applicationID: appID!,
          profilePictureURL,
          supportSlackChannelID: selectedSlackChannelID,
          name: supportUserName,
        },
      });
      if (result.data?.updateSupportBot.success) {
        setSuccessMessage('Changes saved successfully.');
        void refetchApplication();
        return;
      }
      let updateSupportBotErrorMessage =
        'An unexpected error has occurred. Please try again.';
      if (
        result.data?.updateSupportBot.failureDetails?.message ===
        Errors.APPLICATION_SUPPORT_ORG_AND_CHANNEL_ID_DUPLICATE
      ) {
        updateSupportBotErrorMessage =
          'Another project is using the selected channel, please choose another one which is not already being used for support messages';
      }
      setErrorMessage(updateSupportBotErrorMessage);
    },
    [
      appID,
      imageURL,
      logError,
      refetchApplication,
      selectedSlackChannelID,
      supportUserName,
      updateSupportBot,
      uploadImageFile,
    ],
  );

  const onUnlink = useCallback(
    async (confirmationText: string) => {
      // eslint-disable-next-line no-alert
      if (confirm(confirmationText)) {
        try {
          const result = await removeSlackOrg({
            variables: { applicationID: appID! },
          });
          if (result.data?.removeSlackSupportOrg.success !== true) {
            throw new Error('Unsuccessful request to remove Slack org');
          }
          setSelectedSlackChannelID(null);
          setSlackConnected(false);
          setSupportUserName('');
          setSuccessMessage('Changes saved successfully.');
          logEvent('unlink-slack-org-for-support-chat', {
            appID: appID!,
          });
          void refetchApplication();
          void refetchSlackChannels();
        } catch (e) {
          logError('Remove Slack support org from project failed', {
            applicationID: appID,
            err: JSON.stringify(e),
          });
          setErrorMessage('An unexpected error has occurred.');
          return;
        }
      }
    },
    [
      removeSlackOrg,
      appID,
      logEvent,
      refetchApplication,
      refetchSlackChannels,
      logError,
    ],
  );

  if (!slackChannelsData?.slackChannelsForConsole) {
    return <SpinnerCover />;
  }

  // Sort alphabetically
  const slackChannels = slackChannelsData.slackChannelsForConsole.sort(
    (channelA, channelB) => channelA.name.localeCompare(channelB.name),
  );

  return (
    <Card.Body>
      {!slackConnected && !slackChannels.length && (
        <div className={classes.overlay}>
          <ConnectSlackModal
            applicationID={appID!}
            onSuccess={() => {
              void refetchSlackChannels();
              setSlackConnected(true);
            }}
          />
        </div>
      )}
      <Form onSubmit={onSubmit}>
        <Form.Group>
          <Form.Label>Support Channel</Form.Label>
          <Form.Text className={classes.explainerText}>
            Choose which channel in your Slack workspace should receive incoming
            support messages from users
          </Form.Text>
          <Form.Text className={classes.explainerText}>
            A channel needs to be selected before the Support user can be @
            mentioned.
          </Form.Text>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>
                Slack channel
                <HelpIconWithTooltip
                  tooltipName="slackChannel"
                  tooltipContent="Messages that mention your support user will appear in this slack channel"
                />
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              required
              as="select"
              value={selectedSlackChannelID ?? ''}
              onChange={(event) => {
                if (
                  application?.supportSlackChannelID &&
                  application.supportSlackChannelID !== event.target.value
                ) {
                  if (
                    // eslint-disable-next-line no-alert
                    confirm(
                      'Changing the slack channel and resubmitting this form will cause all existing support threads to stop updating.  Are you sure you want to continue?',
                    )
                  ) {
                    setSelectedSlackChannelID(event.target.value);
                  }
                } else {
                  setSelectedSlackChannelID(event.target.value);
                }
              }}
            >
              <option value="">Select a slack channel</option>
              {slackChannelsData.slackChannelsForConsole.map((channel) => (
                <option key={channel.slackID} value={channel.slackID}>
                  #{channel.name}
                </option>
              ))}
            </Form.Control>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>Support User Details</Form.Label>
          <Form.Text className={classes.explainerText}>
            Choose what name and avatar messages should appear with your
            team&#39;s replies to users&#39; support messages
          </Form.Text>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>
                Support user name
                <HelpIconWithTooltip
                  tooltipName="supportUserName"
                  tooltipContent="Replies to support messages will come from this name"
                />
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              required
              type="text"
              placeholder={defaultSupportUserName}
              value={supportUserName ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSupportUserName(e.target.value)
              }
            />
          </InputGroup>
        </Form.Group>
        {imageFieldElement}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CustomButton type={'submit'}>Save Changes</CustomButton>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'flex-end',
            marginTop: Sizes.LARGE,
          }}
        >
          <CustomButton
            onClick={() =>
              void onUnlink(
                'Do you want to unlink this Slack workspace and choose a new one? This will stop sharing any previously opened support threads and disable the support user.',
              )
            }
          >
            Unlink Slack Workspace
          </CustomButton>
          <CustomButton
            onClick={() =>
              void onUnlink(
                'Do you want to disable the support user? This will stop sharing any previously opened support threads and unlink the Slack workspace.',
              )
            }
          >
            Disable Support User
          </CustomButton>
        </div>
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
  );
}
