import type * as React from 'react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

import { CONNECT_SLACK_SUCCESS_TEXT } from 'common/const/Strings.ts';
import {
  DISABLE_HOTSPOT_ANNOTATIONS,
  INTEGRATION_CONNECT_SLACK_NUX_SEEN,
  NOTIFICATION_CHANNELS,
} from 'common/const/UserPreferenceKeys.ts';
import type { CustomLinks, NotificationChannels } from 'common/types/index.ts';
import {
  defaultNotificationPreference,
  getNotificationChannels,
} from 'common/util/notifications.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useHacksEnabled } from 'external/src/effects/useHacksEnabled.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { useConnectWithSlack } from 'external/src/effects/useConnectWithSlack.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import type {
  OrganizationFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import { useResetUserHiddenAnnotationsMutation } from 'external/src/graphql/operations.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useIsSlackConnected } from 'external/src/effects/useIsSlackConnected.ts';

type LoggedInSettingsControllerResult = {
  isLoggedIn: true;
  navigate: NavigateFunction;
  showHacks: boolean;
  disableHotspotAnnotations: boolean | undefined;
  handleDisableHotspotAnnotationsChange: (e: any) => void;
  applicationLinks: CustomLinks | undefined;
  showConnectSlackButton: boolean;
  showDisconnectSlackButton: boolean;
  notificationChannels: NotificationChannels;
  enableTasks: boolean;
  enableAnnotations: boolean;
  handleClickConnectSlack: () => unknown;
  handleNotificationChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => unknown;
  isSlackConnected: boolean;
  email: string | null;
  user: UserFragment;
  organization: OrganizationFragment;
};

type NotLoggedInSettingsControllerResult = {
  isLoggedIn: false;
};

export function useSettingsController():
  | LoggedInSettingsControllerResult
  | NotLoggedInSettingsControllerResult {
  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const { showThirdPartyAuthDataModal, hideThirdPartyAuthDataModal } =
    useContextThrowingIfNoProvider(EmbedContext);

  const { isUserConnected } = useIsSlackConnected();
  const { logEvent } = useLogger();
  const { user, email } = useContextThrowingIfNoProvider(IdentityContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const navigate = useNavigate();
  const showHacks = useHacksEnabled();

  const [notificationChannelPreference, setNotificationChannel] =
    usePreference<NotificationChannels>(NOTIFICATION_CHANNELS);

  const [connectToSlackNuxSeen, setConnectToSlackNuxSeen] = usePreference(
    INTEGRATION_CONNECT_SLACK_NUX_SEEN,
  );

  const [disableHotspotAnnotations, setDisableHotspotAnnotations] =
    usePreference(DISABLE_HOTSPOT_ANNOTATIONS);

  const [resetUserHiddenAnnotations] = useResetUserHiddenAnnotationsMutation();
  const handleDisableHotspotAnnotationsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      logEvent('toggle-hotspot-annotations-setting', { to: checked });
      setDisableHotspotAnnotations(!checked);
      if (checked) {
        void resetUserHiddenAnnotations();
      }
    },
    [setDisableHotspotAnnotations, logEvent, resetUserHiddenAnnotations],
  );

  const applicationCtx = useContextThrowingIfNoProvider(ApplicationContext);

  const enableEmailNotifications = useFeatureFlag(
    FeatureFlags.ENABLE_EMAIL_NOTIFICATIONS,
  );

  const handleNotificationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const notificationMethod = target.value;
      const isChecked = event.target.checked;

      logEvent('toggle-notification-setting', {
        type: notificationMethod,
        to: isChecked,
      });
      if (notificationMethod === 'slack') {
        setNotificationChannel({
          ...(notificationChannelPreference ?? defaultNotificationPreference),
          slack: isChecked,
        });
      }
      if (notificationMethod === 'email') {
        setNotificationChannel({
          ...(notificationChannelPreference ?? defaultNotificationPreference),
          email: isChecked,
        });
      }
    },
    [notificationChannelPreference, setNotificationChannel, logEvent],
  );

  const onSuccessConnectToSlack = useCallback(() => {
    hideThirdPartyAuthDataModal();
    if (!connectToSlackNuxSeen) {
      setConnectToSlackNuxSeen(true);
    }
    return showToastPopup?.(CONNECT_SLACK_SUCCESS_TEXT);
  }, [
    hideThirdPartyAuthDataModal,
    connectToSlackNuxSeen,
    setConnectToSlackNuxSeen,
    showToastPopup,
  ]);

  const onError = useCallback(() => {
    hideThirdPartyAuthDataModal();
  }, [hideThirdPartyAuthDataModal]);

  const connectToSlackFlow = useConnectWithSlack({
    onSuccess: onSuccessConnectToSlack,
    onError,
  });

  const { enableTasks, enableAnnotations, enableSlack } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  const handleClickConnectSlack = useCallback(() => {
    logEvent('click-connect-slack-settings');

    showThirdPartyAuthDataModal({
      teamName: organization?.linkedOrganization?.name,
    });
    connectToSlackFlow();
  }, [
    connectToSlackFlow,
    logEvent,
    organization?.linkedOrganization?.name,
    showThirdPartyAuthDataModal,
  ]);

  if (!user || !organization) {
    return { isLoggedIn: false };
  }

  const notificationChannels = getNotificationChannels(
    notificationChannelPreference,
    user.id,
    !!email,
    isUserConnected,
  );

  const showConnectSlackButton = !isUserConnected && enableSlack;

  const showDisconnectSlackButton = !!organization.linkedOrganization?.name;

  return {
    navigate,
    showHacks,
    disableHotspotAnnotations,
    handleDisableHotspotAnnotationsChange,
    applicationLinks: applicationCtx?.applicationLinks,
    showConnectSlackButton,
    showDisconnectSlackButton,
    notificationChannels,
    isLoggedIn: true,
    enableTasks,
    enableAnnotations,
    handleClickConnectSlack,
    handleNotificationChange,
    isSlackConnected: isUserConnected,
    email: enableEmailNotifications ? email : null,
    user,
    organization,
  };
}
