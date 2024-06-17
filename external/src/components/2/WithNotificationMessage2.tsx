/* eslint-disable i18next/no-literal-string */
import { useCallback, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import type { Placement } from '@floating-ui/react-dom';

import { WithBadge2 } from 'external/src/components/ui2/WithBadge2.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { ACTIVATION_FIRST_MESSAGE_SENT } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { CustomWelcomeNotificationImage } from 'external/src/components/ui2/CustomWelcomeNoticiationImage.tsx';
import { CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID } from 'common/const/Ids.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  notificationMessageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-xs'),
    backgroundColor: cssVar('color-brand-primary'),
    width: 'min-content',
    borderRadius: cssVar('space-4xs'),
  },
  withNotification: {
    display: 'inline-block',
  },
});

type NotificationType = 'floatingThreads' | 'sidebarLauncher';

type Props = {
  notificationType: NotificationType;
  offset?: number | ((placement: Placement) => number);
  children: JSX.Element;
};

export function WithNotificationMessage2({
  notificationType,
  offset = 2,
  children,
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();

  const { logEvent } = useLogger();

  const showActivationNux = useFeatureFlag(
    FeatureFlags.SHOW_ACTIVATION_WELCOME_MESSAGE_NUX,
  );

  const applicationContext = useContextThrowingIfNoProvider(ApplicationContext);

  const [showNotificationMessage, setShowNotificationMessage] = useState(false);

  const [viewerFirstMessageSent] = usePreference<boolean>(
    ACTIVATION_FIRST_MESSAGE_SENT,
  );

  const {
    styles: popperStyles,
    setReferenceElement,
    setPopperElement,
  } = usePopperCreator({
    offset,
  });

  const isCordApplication =
    applicationContext?.applicationID ===
      CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID ||
    applicationContext?.applicationEnvironment === 'demo';

  const notificationMessageText = useMemo(() => {
    if (
      isCordApplication ||
      applicationContext?.applicationEnvironment === 'sampletoken'
    ) {
      return (
        <Text2 color="base">
          This will be an informative message for new users that hover on the
          button the first time, and then disappears once they successfully sent
          their first message
        </Text2>
      );
    } else {
      return (
        <Text2 color="base">
          You can now <strong>comment</strong>, <strong>mention</strong>, and
          <strong> assign</strong>{' '}
          {applicationContext?.applicationName
            ? `in ${applicationContext?.applicationName}`
            : 'here'}
          ! Click this button to{' '}
          {notificationType === 'floatingThreads'
            ? 'add your first comment.'
            : 'start collaborating.'}
        </Text2>
      );
    }
  }, [
    applicationContext?.applicationEnvironment,
    applicationContext?.applicationName,
    isCordApplication,
    notificationType,
  ]);

  const NotificationMessageElement = useMemo(() => {
    return (
      <div
        ref={setPopperElement}
        style={{ ...popperStyles, zIndex: ZINDEX.popup }}
      >
        <ContentBox2
          padding="xs"
          className={classes.notificationMessageContainer}
          type="large"
        >
          {notificationMessageText}
          <CustomWelcomeNotificationImage />
        </ContentBox2>
      </div>
    );
  }, [
    setPopperElement,
    popperStyles,
    classes.notificationMessageContainer,
    notificationMessageText,
  ]);

  const onButtonOver = useCallback(() => {
    logEvent('show-activation-nux-message');
    setShowNotificationMessage(true);
  }, [logEvent]);

  const onButtonLeave = useCallback(
    () => setShowNotificationMessage(false),
    [],
  );

  if (!showActivationNux || viewerFirstMessageSent) {
    return children;
  }

  return (
    <>
      <Box2
        forwardRef={setReferenceElement}
        onMouseEnter={onButtonOver}
        onMouseDown={onButtonLeave}
        onMouseLeave={onButtonLeave}
        className={classes.withNotification}
      >
        <WithBadge2 style="badge" badgePosition="bordering_child">
          {children}
        </WithBadge2>
      </Box2>
      {showNotificationMessage && <Portal>{NotificationMessageElement}</Portal>}
    </>
  );
}
