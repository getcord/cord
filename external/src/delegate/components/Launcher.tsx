import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { motion } from 'framer-motion';

import { Sizes } from 'common/const/Sizes.ts';
import { PagePresenceContext } from 'external/src/context/presence/PagePresenceContext.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useSidebarVisible } from 'external/src/delegate/hooks/useSidebarVisiblePreference.ts';
import {
  useObserveElementWidth,
  useRearrangeOtherLaunchers,
} from 'external/src/delegate/hooks/useRearrangeOtherLaunchers.ts';
import { LAUNCHER_CONTAINER_ID } from 'common/const/ElementIDs.ts';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useDeepLinkThreadIDQuery } from 'external/src/graphql/operations.ts';
import { SidebarConfigContext } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';
import { Facepile2 } from 'external/src/components/ui2/Facepile2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { LauncherIcon2 } from 'external/src/delegate/components/LauncherIcon2.tsx';
import { LauncherNuxMessage } from 'external/src/components/2/LauncherNuxMessage.tsx';
import { LAUNCHER_NUX_DISMISSED } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  wrapper: {
    position: 'fixed',
    bottom: Sizes.LAUNCHER_FIXED_BOTTOM_LENGTH,
    right: Sizes.LAUNCHER_FIXED_RIGHT_LENGTH,
    zIndex: ZINDEX.sidebar,
    '&:hover $launcherFacepile2': {
      backgroundColor: cssVar('launcher-background-color--hover'),
    },
    '&:active $launcherFacepile2': {
      backgroundColor: cssVar('launcher-background-color--active'),
    },
    '&:hover $launcherFacepile2Text': {
      color: cssVar('launcher-content-color--hover'),
    },
    '&:active $launcherFacepile2Text': {
      color: cssVar('launcher-content-color--active'),
    },
  },
  launcherFacepile2: {
    backgroundColor: cssVar('launcher-background-color'),
  },
  launcherFacepile2Text: {
    color: cssVar('launcher-content-color'),
    marginLeft: cssVar('space-4xs'),
  },
});

type Props = {
  sidebarVisible: boolean;
  onOpen?: () => void;
};

export function Launcher({ sidebarVisible, onOpen }: Props) {
  const sidebarConfigCtx = useContextThrowingIfNoProvider(SidebarConfigContext);
  const classes = useStyles();

  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperWidth = useObserveElementWidth(wrapperRef);

  const isDragging = useRef(false);

  const [launcherNuxDismissed, setLauncherNuxDismissed] = usePreference(
    LAUNCHER_NUX_DISMISSED,
  );

  // Assumption: if we showing the sidebar, then we are also showing the
  // <CloseSidebarButton />, so rearrange other launchers for it. This needs to
  // be done from the delegate since iframe can't re-arrange other launchers
  // that don't live in its iframe
  // TODO: this shouldn't apply when using EmbeddedLauncher, i think
  useRearrangeOtherLaunchers(
    sidebarVisible ? Sizes.CLOSE_SIDEBAR_ICON_WIDTH : wrapperWidth,
  );

  const usersOnPage = useContextThrowingIfNoProvider(PagePresenceContext);

  const viewerID = user?.id;

  const usersExcludingViewer = useMemo(
    () =>
      usersToUserData(
        usersOnPage.filter((userOnPage) => userOnPage.id !== viewerID),
      ),
    [usersOnPage, viewerID],
  );

  const [_, setSidebarVisible] = useSidebarVisible();
  const { logEvent } = useLogger();

  // If there is a deep linked threadID currently stored for the user, we should
  // open the sidebar, as it is most likely on this page which is being loaded because
  // the link was clicked. Edge cases could happen where it is not on this page,
  // e.g. if for some reason our partner's website redirected the user to another
  // page on their site, but this is unlikely.
  const { data } = useDeepLinkThreadIDQuery();
  useEffect(() => {
    if (data?.viewer?.deepLinkInfo) {
      setSidebarVisible(true);
    }
  }, [data, setSidebarVisible]);

  const toggleSidebar = useCallback(() => {
    if (isDragging.current) {
      return;
    }
    logEvent('toggle-sidebar-visibility', { to: !sidebarVisible });
    setSidebarVisible(!sidebarVisible);
    if (!sidebarVisible && onOpen) {
      onOpen();
    }
  }, [logEvent, sidebarVisible, setSidebarVisible, onOpen, isDragging]);

  const { count: inboxCount } = useContextThrowingIfNoProvider(InboxContext);

  const showFacepile = usersExcludingViewer.length > 0;

  const launchNuxSeenRef = useRef(false);

  useEffect(() => {
    if (launchNuxSeenRef.current) {
      return;
    }
    if (sidebarVisible && !launcherNuxDismissed) {
      setLauncherNuxDismissed(true);
      // to allow us to reset this in hacks, if reset in hacks you have to
      // dismiss the nux for it to be removed or refresh app
      launchNuxSeenRef.current = true;
    }
  }, [launcherNuxDismissed, setLauncherNuxDismissed, sidebarVisible]);

  return (
    <div id={LAUNCHER_CONTAINER_ID}>
      {sidebarConfigCtx.showLauncher && !sidebarVisible && (
        <div>
          <LauncherNuxMessage />
          <motion.div
            className={classes.wrapper}
            onClick={toggleSidebar}
            ref={wrapperRef}
            drag
            dragConstraints={{
              left: -200,
              top: -200,
              right: Sizes.LAUNCHER_FIXED_RIGHT_LENGTH,
              bottom: Sizes.LAUNCHER_FIXED_BOTTOM_LENGTH,
            }}
            whileDrag={{ scale: 1.1 }}
            onDragStart={() => {
              logEvent('drag-floating-launcher');
              isDragging.current = true;
            }}
            // onDragEnd runs before onClick. Defer its execution with a setTimeout,
            // otherwise we'd change isDragging before it's evaluated in the `onClick` handler.
            onDragEnd={() => setTimeout(() => (isDragging.current = false), 0)}
            dragMomentum={false}
          >
            <LauncherIcon2 badgeCount={inboxCount}>
              {showFacepile && (
                <Box2 marginRight="2xs">
                  <Facepile2
                    users={usersExcludingViewer}
                    size="xl"
                    className={classes.launcherFacepile2}
                    maxUsers={3}
                    showPresence={false}
                    otherUsersTextClassName={classes.launcherFacepile2Text}
                  />
                </Box2>
              )}
            </LauncherIcon2>
          </motion.div>
        </div>
      )}
    </div>
  );
}
