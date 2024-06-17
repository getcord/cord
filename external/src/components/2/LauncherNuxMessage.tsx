import { useCallback, useEffect } from 'react';
import { createUseStyles } from 'react-jss';

import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { NuxMessage2 } from 'external/src/components/2/NuxMessage2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { LAUNCHER_NUX_DISMISSED } from 'common/const/UserPreferenceKeys.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  container: {
    bottom:
      Sizes.LAUNCHER_FIXED_BOTTOM_LENGTH +
      Sizes.LAUNCHER_ICON_HEIGHT +
      Sizes.LARGE,
    position: 'fixed',
    right: Sizes.LAUNCHER_FIXED_RIGHT_LENGTH,
    zIndex: ZINDEX.popup,
  },
});

export const LauncherNuxMessage = () => {
  const classes = useStyles();
  const { logEvent } = useLogger();

  const applicationNUX =
    useContextThrowingIfNoProvider(ApplicationContext)?.applicationNUX;

  const [launcherNuxDismissed, setLauncherNuxDismissed] = usePreference(
    LAUNCHER_NUX_DISMISSED,
  );

  useEffect(() => {
    if (!launcherNuxDismissed) {
      logEvent('show-launcher-nux-message');
    }
  }, [launcherNuxDismissed, logEvent]);

  const onLauncherNuxDismissed = useCallback(() => {
    setLauncherNuxDismissed(true);
    logEvent('dismiss-launcher-nux-message');
  }, [logEvent, setLauncherNuxDismissed]);

  if (launcherNuxDismissed) {
    return null;
  }

  if (!applicationNUX) {
    return null;
  }

  const launcherNux = applicationNUX.initialOpen;

  return (
    <NuxMessage2
      title={launcherNux.title}
      icon={
        <Icon2
          name="MegaphoneSimple"
          size="large"
          style={{ transform: 'matrix(-0.94, 0.33, 0.33, 0.94, 0, 0)' }}
        />
      }
      className={classes.container}
      type="floating"
      dismissed={false}
      nuxText={launcherNux.text}
      onDismiss={onLauncherNuxDismissed}
      mediaUrl={launcherNux.imageURL}
    />
  );
};
