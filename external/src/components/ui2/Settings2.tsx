/* eslint-disable i18next/no-literal-string */
import { useMemo, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';

import cx from 'classnames';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { CheckboxAndLabel2 } from 'external/src/components/2/CheckboxAndLabel2.tsx';
import { SettingsSection2 } from 'external/src/components/ui2/SettingsSection2.tsx';
import { ThirdPartyConnectionsButton2 } from 'external/src/components/2/ThirdPartyConnectionsButton2.tsx';
import { ThirdPartyAuthButton2 } from 'external/src/components/2/ThirdPartyAuthButton2.tsx';
import { DisconnectSlackTeam } from 'external/src/components/DisconnectSlackTeam.tsx';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';
import { useSettingsController } from 'external/src/components/useSettingsController.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { Hacks } from 'external/src/components/hacks/Hacks.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { CordWordmark2 } from '@cord-sdk/react/common/icons/customIcons/CordWordmark2.tsx';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { FixedNameAndProfilePicture } from 'external/src/components/puppet/FixedNameAndProfilePicture.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newSettings } from 'external/src/components/ui3/Settings.tsx';

const SETTINGS_HOST_STYLES = {
  '@global': {
    ':host': {
      display: 'block',
    },
    ':host > div': {
      height: '100%',
      maxHeight: 'inherit',
    },
  },
};

const useStyles = createUseStyles({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-xl'),
    overscrollBehavior: 'contain', // Stops scroll chaining to main webpage
    height: '100%',
    maxHeight: 'inherit',
  },
  insideSidebar: {
    backgroundColor: cssVar('sidebar-background-color'),
  },
  insideSettings: {
    backgroundColor: cssVar('settings-background-color'),
  },
  insideInbox: {
    backgroundColor: cssVar('inbox-background-color'),
  },
  flex: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-2xs'),
  },
  hacks: {
    zIndex: ZINDEX.popup,
    overflow: 'auto',
    overscrollBehavior: 'contain', // Stops scroll chaining to main webpage
  },
  brandingText: {
    alignItems: 'center',
    display: 'inline-flex',
    fontSize: cssVar('font-size-small'),
  },
  brandingWordmark: {
    height: cssVar('space-xs'),
    marginLeft: cssVar('space-3xs'),
    width: 'auto',
  },
});

type SettingsLocation = 'sidebar' | 'inbox' | 'settings';

type Props = {
  location: SettingsLocation;
  showTitle?: boolean;
  showCordBranding: boolean;
  withPadding?: boolean;
};

export const Settings2 = withNewCSSComponentMaybe(
  newSettings,
  function Settings2({
    showTitle = true,
    showCordBranding,
    withPadding = true,
    location,
  }: Props) {
    const classes = useStyles();
    const mondayTasks = useFeatureFlag(FeatureFlags.MONDAY_TASKS);
    const [openHacks, setOpenHacks] = useState(false);

    const settingStyles = useMemo(
      () => jss.createStyleSheet(SETTINGS_HOST_STYLES).toString(),
      [],
    );

    const settingsController = useSettingsController();

    const applicationName =
      useContextThrowingIfNoProvider(ApplicationContext)?.applicationName;

    if (!settingsController.isLoggedIn) {
      return (
        <Box2
          backgroundColor="base-strong"
          borderRadius="small"
          padding="2xs"
          margin="2xs"
        >
          <Text2
            color="content-emphasis"
            center={true}
          >{`You're not logged in`}</Text2>
        </Box2>
      );
    }

    const {
      showHacks,
      disableHotspotAnnotations,
      handleDisableHotspotAnnotationsChange,
      showConnectSlackButton,
      showDisconnectSlackButton,
      notificationChannels,
      enableTasks,
      enableAnnotations,
      handleClickConnectSlack,
      handleNotificationChange,
      isSlackConnected,
      email,
      user,
    } = settingsController;

    return (
      <>
        <style>{settingStyles}</style>
        <Box2
          className={cx(classes.settings, {
            [classes.insideSidebar]: location === 'sidebar',
            [classes.insideSettings]: location === 'settings',
            [classes.insideInbox]: location === 'inbox',
          })}
          padding={withPadding ? 'm' : undefined}
          scrollable={true}
        >
          {showTitle && (
            <Row2>
              <Text2 color="content-primary">Collaboration settings</Text2>
            </Row2>
          )}

          <SettingsSection2 title="Profile">
            <FixedNameAndProfilePicture user={user} />
          </SettingsSection2>

          {(isSlackConnected || email) && (
            <SettingsSection2 title="Notification preferences">
              {isSlackConnected && (
                <CheckboxAndLabel2
                  key={'slack'}
                  value={'slack'}
                  label={'Slack'}
                  onChange={handleNotificationChange}
                  checked={notificationChannels.slack}
                />
              )}
              {email && (
                <CheckboxAndLabel2
                  key={'email'}
                  value={'email'}
                  label={'Email'}
                  onChange={handleNotificationChange}
                  checked={notificationChannels.email}
                />
              )}
            </SettingsSection2>
          )}

          {enableAnnotations && (
            <SettingsSection2
              title="Other preferences"
              subtext="Control personal preferences for app-wide features"
            >
              <WithTooltip2 label="Show all annotations in open threads on the page">
                <CheckboxAndLabel2
                  key="hotspotAnnotations"
                  value="hotspotAnnotations"
                  label="Show annotations on page"
                  onChange={handleDisableHotspotAnnotationsChange}
                  checked={!disableHotspotAnnotations}
                />
              </WithTooltip2>
            </SettingsSection2>
          )}

          {(showConnectSlackButton || enableTasks) && (
            <SettingsSection2
              title="Integrations"
              subtext="Add tasks to your comments, or share your comments and @mention teammates on Slack"
            >
              {showConnectSlackButton && (
                <ThirdPartyAuthButton2
                  provider="slack"
                  onClick={handleClickConnectSlack}
                />
              )}

              {enableTasks && (
                <>
                  <ThirdPartyConnectionsButton2 connection="asana" />
                  <ThirdPartyConnectionsButton2 connection="jira" />
                  <ThirdPartyConnectionsButton2 connection="linear" />
                  {/* <ThirdPartyConnectionsButton connection="trello" /> // Not an option for tasks yet */}
                  {mondayTasks && (
                    <ThirdPartyConnectionsButton2 connection="monday" />
                  )}
                </>
              )}
            </SettingsSection2>
          )}

          {showDisconnectSlackButton && <DisconnectSlackTeam />}

          {showHacks && (
            <Link2
              onClick={() => setOpenHacks(true)}
              color="content-emphasis"
              linkStyle={'primary'}
              underline={false}
            >
              ❤️
            </Link2>
          )}

          {showCordBranding && (
            <Link2
              href={
                'https://cord.com/?utm_medium=' +
                (encodeURIComponent(process.env.NODE_ENV ?? 'prod') ?? '') +
                (applicationName
                  ? '&utm_source=' +
                    encodeURIComponent(applicationName?.toLowerCase())
                  : '')
              }
              newTab={true}
              linkStyle="primary"
              underline={false}
            >
              <Text2
                color="content-secondary"
                className={classes.brandingText}
                as="span"
              >
                Collaboration powered by{' '}
                <CordWordmark2
                  className={classes.brandingWordmark}
                  fill={cssVar('color-content-secondary')}
                />
              </Text2>
            </Link2>
          )}
        </Box2>

        {openHacks && (
          <Box2
            position="absolute"
            insetZero={true}
            backgroundColor="base"
            borderRadius="large"
            className={classes.hacks}
          >
            <Hacks closeHacks={() => setOpenHacks(false)} />
          </Box2>
        )}
      </>
    );
  },
);
