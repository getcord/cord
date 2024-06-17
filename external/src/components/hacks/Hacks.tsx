import * as React from 'react';
import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';

import {
  FeatureFlag,
  INTEGRATION_COMPLETE_PROFILE_NUX_SEEN,
  INTEGRATION_WELCOME_NUX_SEEN,
  INTEGRATION_PAGE_VISIT_COUNT,
  NUX_STEPS_COLLAPSED,
  NUX_STEPS_DISMISSED,
  NUX_VIDEO_WATCHED,
  NUX_SLACK_INFO_OPENED,
  NUX_WELCOME_PAGE_SEEN,
  INTEGRATION_CONNECT_SLACK_NUX_SEEN,
  INTEGRATION_SLACK_IS_CONNECTED_NUX_WAS_FORCED,
  INTEGRATION_LINK_SLACK_PROFILE_NUX_SEEN,
  INTEGRATION_SLACK_IS_CONNECTED_NUX_SEEN,
  CONVERSATION_NUX_DISMISSED,
  INBOX_NUX_DISMISSED,
  ENABLE_MESSAGE_DEBUG,
  ENABLE_THREAD_DEBUG,
  LAUNCHER_NUX_DISMISSED,
  ACTIVATION_FIRST_MESSAGE_SENT,
} from 'common/const/UserPreferenceKeys.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import {
  HACKS_PANEL_EXCEPTION_NON_RENDER,
  HACKS_PANEL_EXCEPTION_RENDER,
} from 'external/src/logging/ErrorHandler.tsx';
import { Box } from 'external/src/components/ui/Box.tsx';
import { Spacing } from 'common/const/Spacing.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import { HacksTopNav2 } from 'external/src/components/hacks/HacksTopNav2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  fullWidth: {
    display: 'block',
    width: '100%',
  },
  checkBox: {
    cursor: 'pointer',
    height: Sizes.LARGE,
    marginRight: Sizes.MEDIUM,
    width: Sizes.LARGE,
  },
  button: {
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  marginAuto: {
    margin: 'auto',
  },
  threeColumnGrid: {
    alignItems: 'center',
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr',
  },
});

export function Hacks({ closeHacks }: { closeHacks: () => void }) {
  const classes = useStyles();
  const identityState = useContextThrowingIfNoProvider(IdentityContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const [logGraphQLToConsole, setLogGraphQLToConsole] = usePreference(
    FeatureFlag.LOG_GRAPHQL_TO_CONSOLE,
  );

  const [emailSharingEnabled, setEmailSharingEnabled] = usePreference(
    FeatureFlag.EMAIL_SHARING,
  );

  const [messageDebugEnabled, setMessageDebugEnabled] =
    usePreference(ENABLE_MESSAGE_DEBUG);

  const [threadDebugEnabled, setThreadDebugEnabled] =
    usePreference(ENABLE_THREAD_DEBUG);

  const { startTimedEvent } = useLogger();

  React.useEffect(() => {
    const endTimedEvent = startTimedEvent('hacks-panel-mounted');
    return () => {
      endTimedEvent();
    };
  }, [startTimedEvent]);

  const userID = identityState.user.id;
  const orgID = organization?.id;

  const [welcomeNuxSeen, setWelcomeNuxSeen] = usePreference(
    INTEGRATION_WELCOME_NUX_SEEN,
  );

  const [completeProfileNuxSeen, setCompleteProfileNuxSeen] = usePreference(
    INTEGRATION_COMPLETE_PROFILE_NUX_SEEN,
  );

  const [connectToSlackNuxSeen, setConnectToSlackNuxSeen] = usePreference(
    INTEGRATION_CONNECT_SLACK_NUX_SEEN,
  );
  const [slackIsConnectedNuxWasForced, setSlackIsConnectedNuxWasForced] =
    usePreference(INTEGRATION_SLACK_IS_CONNECTED_NUX_WAS_FORCED);
  const [slackIsConnectedNuxSeen, setSlackIsConnectedNuxSeen] = usePreference(
    INTEGRATION_SLACK_IS_CONNECTED_NUX_SEEN,
  );

  const [linkedToSlackProfileNuxSeen, setLinkToSlackProfileNuxSeen] =
    usePreference(INTEGRATION_LINK_SLACK_PROFILE_NUX_SEEN);

  const [pageVisitCount, setPageVisitCount] = usePreference<number>(
    INTEGRATION_PAGE_VISIT_COUNT,
  );

  // Cord2.0 Nux
  const [conversationNuxDismissed, setConversationNuxDismissed] = usePreference(
    CONVERSATION_NUX_DISMISSED,
  );
  const [inboxNuxDismissed, setInboxNuxDismissed] =
    usePreference(INBOX_NUX_DISMISSED);

  const [launcherNuxDismissed, setLauncherNuxDismissed] = usePreference(
    LAUNCHER_NUX_DISMISSED,
  );

  const [userSentFirstMessage, setUserSentFirstMessage] = usePreference(
    ACTIVATION_FIRST_MESSAGE_SENT,
  );

  // app.cord.com Nux
  const [welcomePageSeen, setWelcomePageSeen] = usePreference(
    NUX_WELCOME_PAGE_SEEN,
  );
  const [stepsCollapsed, setStepsCollapsed] =
    usePreference(NUX_STEPS_COLLAPSED);
  const [stepsDismissed, setStepsDismissed] =
    usePreference(NUX_STEPS_DISMISSED);
  const [videoWatched, setVideoWatched] = usePreference(NUX_VIDEO_WATCHED);
  const [slackInfoOpened, setSlackInfoOpened] = usePreference(
    NUX_SLACK_INFO_OPENED,
  );

  return (
    <>
      <HacksTopNav2 closeHacks={closeHacks} />
      <Separator2 marginVertical="none" />
      <Box
        padding={Spacing.HORIZONTAL_M | Spacing.VERTICAL_L}
        backgroundColor={'WHITE'}
        scrollable={true}
      >
        <h2>Hacks Toggles</h2>
        <div>
          <div className={classes.row}>
            <input
              className={classes.checkBox}
              type="checkbox"
              onChange={() => setMessageDebugEnabled(!messageDebugEnabled)}
              checked={messageDebugEnabled}
            />
            <div>Enable message debug</div>
          </div>

          <div className={classes.row}>
            <input
              className={classes.checkBox}
              type="checkbox"
              onChange={() => setThreadDebugEnabled(!threadDebugEnabled)}
              checked={threadDebugEnabled}
            />
            <div>Enable Thread debug</div>
          </div>
        </div>
        <hr />
        <h2>Context Information</h2>
        <div>User ID</div>
        <div>
          <input
            className={classes.fullWidth}
            type="text"
            value={userID}
            readOnly={true}
            placeholder="Set user ID..."
          />
        </div>
        <hr />
        <div>Org ID</div>
        <div>
          <input
            className={classes.fullWidth}
            type="text"
            value={orgID}
            readOnly={true}
            placeholder="Set org ID..."
          />
        </div>
        <hr />
        <div>Page Context</div>
        <div>
          <input
            className={classes.fullWidth}
            type="text"
            disabled={true}
            value={JSON.stringify(pageContext)}
          />
        </div>
        <hr />
        <hr />

        <h2>Feature Flags 🚩</h2>
        <div>
          <div className={classes.row}>
            <input
              className={classes.checkBox}
              type="checkbox"
              onChange={() => setEmailSharingEnabled(!emailSharingEnabled)}
              checked={emailSharingEnabled}
            />
            <div>Force-enable Email Sharing</div>
          </div>
          🚩🚩🚩🚩🚩🚩🚩🚩
        </div>

        <hr />
        <div className={classes.row}>
          <input
            className={classes.checkBox}
            type="checkbox"
            onChange={() => setLogGraphQLToConsole(!logGraphQLToConsole)}
            checked={logGraphQLToConsole}
          />
          <div>Log GraphQL to console</div>
        </div>

        <hr />

        <div className={classes.threeColumnGrid}>
          <h2 style={{ gridColumn: 'span 3' }}>
            Reset Integration NUX user preferences
          </h2>
          <p>Welcome NUX:</p>
          <p className={classes.marginAuto}>{welcomeNuxSeen + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setWelcomeNuxSeen(false)}
          >
            Reset to false
          </Button2>
          <p>Complete Profile NUX:</p>
          <p className={classes.marginAuto}>{completeProfileNuxSeen + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setCompleteProfileNuxSeen(false)}
          >
            Reset to false
          </Button2>
          <p>Connect Slack NUX:</p>
          <p className={classes.marginAuto}>{connectToSlackNuxSeen + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setConnectToSlackNuxSeen(false)}
          >
            Reset to false
          </Button2>
          <p>Connect Slack NUX was forced:</p>
          <p className={classes.marginAuto}>
            {slackIsConnectedNuxWasForced + ''}
          </p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setSlackIsConnectedNuxWasForced(false)}
          >
            Reset to false
          </Button2>
          <p>Link to Slack Profile NUX:</p>
          <p className={classes.marginAuto}>
            {linkedToSlackProfileNuxSeen + ''}
          </p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setLinkToSlackProfileNuxSeen(false)}
          >
            Reset to false
          </Button2>
          <p>Slack is connected NUX:</p>
          <p className={classes.marginAuto}>{slackIsConnectedNuxSeen + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setSlackIsConnectedNuxSeen(false)}
          >
            Reset to false
          </Button2>
          <p>Page Visit Count:</p>
          <p className={classes.marginAuto}>{pageVisitCount + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setPageVisitCount(0)}
          >
            Reset to 0
          </Button2>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              setWelcomeNuxSeen(false);
              setCompleteProfileNuxSeen(false);
              setConnectToSlackNuxSeen(false);
              setLinkToSlackProfileNuxSeen(false);
              setPageVisitCount(0);
              setSlackIsConnectedNuxWasForced(false);
              setSlackIsConnectedNuxSeen(false);
            }}
          >
            Reset all to false
          </Button2>
        </div>

        <hr />

        <div className={classes.threeColumnGrid}>
          <h2 style={{ gridColumn: 'span 3' }}>
            Reset Cord2.0 NUX user preferences
          </h2>
          <p>Conversation NUX dismissed:</p>
          <p className={classes.marginAuto}>{conversationNuxDismissed + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              setConversationNuxDismissed(false);
            }}
          >
            Reset to false
          </Button2>
          <p>Inbox NUX dismissed:</p>
          <p className={classes.marginAuto}>{inboxNuxDismissed + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              setInboxNuxDismissed(false);
            }}
          >
            Reset to false
          </Button2>
          <p>Floating Launcher NUX dismissed:</p>
          <p className={classes.marginAuto}>{launcherNuxDismissed + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              setLauncherNuxDismissed(false);
            }}
          >
            Reset to false
          </Button2>
          <p>User sent first message:</p>
          <p className={classes.marginAuto}>{userSentFirstMessage + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              setUserSentFirstMessage(false);
            }}
          >
            Reset to false
          </Button2>
        </div>

        <hr />

        <div className={classes.threeColumnGrid}>
          <h2 style={{ gridColumn: 'span 3' }}>
            Reset app.cord.com NUX user preferences
          </h2>
          <p>Welcome Page Seen:</p>
          <p className={classes.marginAuto}>{welcomePageSeen + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setWelcomePageSeen(!welcomePageSeen)}
          >
            {welcomePageSeen ? 'Set to false' : 'Set to true'}
          </Button2>
          <p>Steps Collapsed:</p>
          <p className={classes.marginAuto}>{stepsCollapsed + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setStepsCollapsed(!stepsCollapsed)}
          >
            {stepsCollapsed ? 'Set to false' : 'Set to true'}
          </Button2>
          <p>Steps Dismissed:</p>
          <p className={classes.marginAuto}>{stepsDismissed + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setStepsDismissed(!stepsDismissed)}
          >
            {stepsDismissed ? 'Set to false' : 'Set to true'}
          </Button2>
          <p>Nux Video Watched:</p>
          <p className={classes.marginAuto}>{videoWatched + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setVideoWatched(!videoWatched)}
          >
            {videoWatched ? 'Set to false' : 'Set to true'}
          </Button2>
          <p>Cord/Slack Info Opened:</p>
          <p className={classes.marginAuto}>{slackInfoOpened + ''}</p>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => setSlackInfoOpened(!slackInfoOpened)}
          >
            {slackInfoOpened ? 'Set to false' : 'Set to true'}
          </Button2>
        </div>

        <hr />

        <div>
          <h2>For testing exception logging</h2>
          <Button2
            buttonType="secondary"
            size="medium"
            onClick={() => {
              throw new Error(HACKS_PANEL_EXCEPTION_NON_RENDER);
            }}
          >
            Trigger exception in onClick handler
          </Button2>
          <RenderCodeExceptionTrigger />
        </div>
        <hr />
      </Box>
    </>
  );
}

function RenderCodeExceptionTrigger() {
  const [state, setState] = useState<boolean>(false);

  useEffect(() => {
    if (state) {
      setState(false);
    }
  }, [state, setState]);

  if (state) {
    throw new Error(HACKS_PANEL_EXCEPTION_RENDER);
  }

  return (
    <Button2
      buttonType="secondary"
      size="medium"
      onClick={() => setState(true)}
    >
      Trigger exception in render code
    </Button2>
  );
}
