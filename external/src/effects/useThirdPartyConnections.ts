import { useMemo, useCallback, useEffect, useRef, useContext } from 'react';
import {
  openPopupWindow,
  jiraLoginURL,
  asanaLoginURL,
  linearLoginURL,
  trelloLoginURL,
  mondayConnectInstructionsURL,
} from 'external/src/lib/auth/utils.ts';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import type { ThirdPartyConnectionType } from 'external/src/graphql/operations.ts';
import {
  useThirdPartyConnectionsQuery,
  useDisconnectThirdPartyMutation,
} from 'external/src/graphql/operations.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { useDefaultTaskType } from 'external/src/effects/useDefaultTaskType.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function useThirdPartyConnections(
  connection?: ThirdPartyConnectionType,
) {
  const orgContext = useContextThrowingIfNoProvider(OrganizationContext);
  const threadContext = useContext(Thread2Context);

  const threadOrgID =
    threadContext === NO_PROVIDER_DEFINED
      ? null
      : threadContext.thread?.externalOrgID;
  const orgIDToQuery = threadOrgID ?? orgContext.organization?.externalID;

  const { data: thirdPartyConnections, refetch: refreshThirdPartyConnections } =
    useThirdPartyConnectionsQuery({
      skip: !orgIDToQuery,
      variables: { _externalOrgID: orgIDToQuery },
    });

  const { logEvent } = useLogger();

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const cancelMonitoringIntervalRef = useRef<NodeJS.Timeout>();

  const clearMonitoringInterval = useCallback(() => {
    if (cancelMonitoringIntervalRef.current) {
      clearInterval(cancelMonitoringIntervalRef.current);
    }
    cancelMonitoringIntervalRef.current = undefined;
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<any>) => {
      if (event.origin === APP_ORIGIN && event.data?.service === connection) {
        clearMonitoringInterval();
        switch (event.data?.message) {
          case 'oauth_flow_complete': {
            void refreshThirdPartyConnections();
            logEvent('connect-service-successful', {
              service: connection!,
            });
            showToastPopup?.(
              `Successfully connected to ${capitalizeFirstLetter(connection!)}`,
            );
            break;
          }
          case 'oauth_flow_error': {
            logEvent('connect-service-failed', {
              service: connection!,
              reason: 'error',
            });
            break;
          }
          case 'oauth_flow_cancelled': {
            logEvent('connect-service-failed', {
              service: connection!,
              reason: 'cancelled',
            });
            break;
          }
        }
      }
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [
    refreshThirdPartyConnections,
    logEvent,
    clearMonitoringInterval,
    connection,
    showToastPopup,
  ]);

  const [disconnectThirdPartyMutation] = useDisconnectThirdPartyMutation();

  const [defaultTaskType, setDefaultTaskType] = useDefaultTaskType();

  const connected = useCallback(
    (type: ThirdPartyConnectionType) =>
      !!thirdPartyConnections?.viewer[type].connected,
    [thirdPartyConnections],
  );

  const startConnectFlow = useCallback(
    (type: ThirdPartyConnectionType) => {
      if (thirdPartyConnections) {
        logEvent(`connect-service-started`, { service: type });

        let popupWindow: Window | null = null;

        switch (type) {
          case 'jira': {
            popupWindow = openPopupWindow(
              jiraLoginURL(thirdPartyConnections.viewer.jira.oAuthStateToken),
              700,
              850,
            );
            break;
          }
          case 'asana': {
            popupWindow = openPopupWindow(
              asanaLoginURL(thirdPartyConnections.viewer.asana.oAuthStateToken),
              700,
              900,
            );
            break;
          }
          case 'linear': {
            popupWindow = openPopupWindow(
              linearLoginURL(
                thirdPartyConnections.viewer.linear.oAuthStateToken,
              ),
              700,
              500,
            );
            break;
          }
          case 'trello': {
            popupWindow = openPopupWindow(
              trelloLoginURL(
                thirdPartyConnections.viewer.trello.oAuthStateToken,
              ),
              700,
              900,
            );
            break;
          }
          case 'monday': {
            popupWindow = openPopupWindow(
              mondayConnectInstructionsURL(
                thirdPartyConnections.viewer.monday.oAuthStateToken,
              ),
              700,
              900,
            );
            break;
          }
        }

        if (popupWindow) {
          // popupWindow.addEventListener('close') doesn't work cross-origin,
          // so we set up a timer that checks every second if the window is
          // still around. this timer is cancelled either when the connect
          // flow succeeds (see onMessage function) or when the popup window
          // gets closed.
          cancelMonitoringIntervalRef.current = setInterval(() => {
            if (!popupWindow) {
              clearMonitoringInterval();
              return;
            }

            if (popupWindow.closed) {
              clearMonitoringInterval();
              logEvent(`connect-service-failed`, {
                service: type,
                reason: 'cancelled',
              });
            }
          }, 1000);
        }
      }
    },
    [thirdPartyConnections, clearMonitoringInterval, logEvent],
  );

  const disconnect = useCallback(
    async (type: ThirdPartyConnectionType, showPopup = true) => {
      if (type === defaultTaskType) {
        setDefaultTaskType('cord');
      }
      await disconnectThirdPartyMutation({
        variables: { type, _externalOrgID: orgIDToQuery },
      });
      logEvent(`disconnect-service`, { service: type });
      await refreshThirdPartyConnections();
      if (showPopup) {
        showToastPopup?.(
          `Successfully disconnected from ${capitalizeFirstLetter(type)}`,
        );
      }
    },
    [
      defaultTaskType,
      disconnectThirdPartyMutation,
      orgIDToQuery,
      logEvent,
      refreshThirdPartyConnections,
      setDefaultTaskType,
      showToastPopup,
    ],
  );

  return useMemo(
    () => ({
      refresh: refreshThirdPartyConnections,
      connected,
      startConnectFlow,
      disconnect,
    }),
    [connected, startConnectFlow, disconnect, refreshThirdPartyConnections],
  );
}
