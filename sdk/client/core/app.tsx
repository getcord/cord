import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import UAParser from 'ua-parser-js';
import type {
  CordSDKOptions,
  CustomRenderers,
  HTMLCordElement,
  JsonObject,
  NavigateFn,
  ThreadOptions,
} from '@cord-sdk/types';
import {
  CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE,
  CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE,
} from '@cord-sdk/types';
import type { ElementName } from '@cord-sdk/components';

import { initSentry } from 'external/src/logging/sentry/sdk.ts';
import { ComponentGlobalEventsProvider } from 'external/src/context/globalEvents/ComponentGlobalEventsProvider.tsx';
import { PageContextProvider } from 'external/src/context/page/PageContextProvider.tsx';
import { DelegateProvider } from 'external/src/context/delegate/DelegateProvider.tsx';
import { GlobalProvider } from 'external/src/context/global/GlobalContext.tsx';
import { DocumentController } from 'external/src/delegate/components/DocumentController.tsx';
import { PortalContext } from 'external/src/context/portal/PortalContext.tsx';
import { JssInjector } from 'external/src/common/JssInjector.tsx';
import type { ThirdPartyInstances } from 'external/src/delegate/annotations/types.ts';
import { useForceRender } from 'sdk/client/core/react/useForceRender.ts';
import { PageUrlProvider } from 'external/src/context/page/PageUrlProvider.tsx';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { ThreadsProvider2 } from 'external/src/context/threads2/ThreadsProvider2.tsx';
import type { InternalScreenshotOptions } from 'external/src/context/config/ConfigurationContext.ts';
import { PartialConfigurationProvider } from 'external/src/context/config/PartialConfigurationProvider.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import type {
  ICordComponent,
  IPrivateCordComponent,
} from 'sdk/client/core/components/index.tsx';
import type { ComponentCallback } from 'sdk/client/core/index.tsx';
import { CordSDK } from 'sdk/client/core/index.tsx';
import { ACTION_MODAL_ID } from 'common/const/ElementIDs.ts';
import { Portal } from 'external/src/components/Portal.tsx';
import { NavigationOverrideProvider } from 'external/src/context/navigation/NavigationOverrideProvider.tsx';
import { PinnedAnnotationsProvider } from 'external/src/context/annotations/PinnedAnnotationsProvider.tsx';
import { ErrorHandler } from 'external/src/logging/ErrorHandler.tsx';
import { FloatingThreadsProvider } from 'external/src/context/floatingThreads/FloatingThreadsProvider.tsx';
import { ResizeObserverProvider } from 'external/src/context/resizeObserver/ResizeObserverProvider.tsx';
import { useLogCssVars } from 'sdk/client/core/react/useLogCssVars.tsx';
import { useLogCssSelectors } from 'sdk/client/core/react/useLogCssSelectors.tsx';
import { TasksRemovalProvider } from 'external/src/context/config/TasksRemovalProvider.tsx';
import { DisabledSidebarWidthProvider } from 'external/src/context/sidebarWidth/SidebarWidthProvider.tsx';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import {
  ENABLE_ALL_NEW_COMPONENTS_CONFIG,
  NewComponentSwitchContext,
} from 'external/src/components/ui3/withNewComponent.tsx';
import { NotificationsProvider } from 'external/src/context/notifications/NotificationsProvider.tsx';
import { useComponentList } from 'sdk/client/core/useComponentList.tsx';
import { MediaModalProvider } from 'external/src/context/mediaModal/MediaModalContext.tsx';
import { SlackRemovalProvider } from 'external/src/context/config/SlackRemovalProvider.tsx';
import { CORD_COMPONENT_BASE_CLASS, CORD_V1 } from 'common/ui/style.ts';
import { watchAccessibleIFramesAndInjectCord } from 'sdk/client/core/iframe/install.ts';

let shouldLogLoadingTime = false;
try {
  shouldLogLoadingTime = !!localStorage.getItem('__cord_log_loading_times__');
} catch {
  // localStorage for some reason not available
}

type AppProps = React.PropsWithChildren<{
  navigate: NavigateFn | null | undefined;
  beforeMessageCreate: CordSDKOptions['beforeMessageCreate'];
  thirdPartyInstances: ThirdPartyInstances;
  enableTasks?: boolean;
  enableAnnotations?: boolean;
  enableSlack?: boolean;
  enablePinnedAnnotations?: boolean;
  threadOptions?: ThreadOptions;
  screenshotOptions?: InternalScreenshotOptions;
  customRenderers: CustomRenderers;
  initialComponents: ICordComponent[];
  setRegisterComponentCallback: (
    callback: ComponentCallback | undefined,
  ) => unknown;
  setUnregisterComponentCallback: (
    callback: ComponentCallback | undefined,
  ) => unknown;
  customEventMetadata?: JsonObject;
}>;

function Components({ components }: { components: ICordComponent[] }) {
  useLogCssVars(components);
  useLogCssSelectors();

  const loggedComponentNames = useRef<Set<string>>(new Set());
  const { logEvent } = useLogger();

  const sdk = CordSDK.get();

  useEffect(() => {
    const componentNamesToLog = [];

    // Our open-source React components don't render into web components,
    // so we don't receive a connectedCallback to register them. To do so,
    // we put them in a list in our CordSDK object and we need to grab
    // them and informally register them here, together with the rest.
    const allComponentNames: string[] = [
      ...components.map((c) => c.nodeName),
      ...(sdk?.__CORD_OPENSOURCE_COMPONENTS ?? new Set()),
    ];
    for (const component of allComponentNames) {
      if (loggedComponentNames.current.has(component)) {
        continue;
      }
      loggedComponentNames.current.add(component);
      componentNamesToLog.push(component);
    }
    if (componentNamesToLog.length > 0) {
      logEvent('sdk-components-used', {
        components: componentNamesToLog,
      });
    }
    // The useEffect will not rerun if a new open-source component
    // is added, but all open-source components currently use regular
    // components. So it will rerun on their registration
  }, [components, logEvent, sdk?.__CORD_OPENSOURCE_COMPONENTS]);
  useEffect(() => {
    const ua = UAParser();
    logEvent('sdk-client-info', {
      browserName: ua.browser.name ?? null,
      browserVersion: ua.browser.version ?? null,
      deviceModel: ua.device.model ?? null,
      deviceVendor: ua.device.vendor ?? null,
      deviceType: ua.device.type ?? null,
      osName: ua.os.name ?? null,
      osVersion: ua.os.version ?? null,
    });
  }, [logEvent]);

  // Only record the first time components are rendered
  if (sdk._timestamps.components === null) {
    sdk._timestamps.components = performance.now();
  }

  useEffect(() => {
    // Only record the first time components finish rendering (specifically, the
    // first event loop after the component rendering began, which is when this
    // useEffect() should be called)
    if (sdk._timestamps.componentsEnd === null) {
      sdk._timestamps.componentsEnd = performance.now();
      // This should always be true, I don't know how we'd get here without these
      if (
        sdk._timestamps.init &&
        sdk._timestamps.render &&
        sdk._timestamps.components
      ) {
        const value = {
          initToRenderMs: sdk._timestamps.render - sdk._timestamps.init,
          renderToComponentsMs:
            sdk._timestamps.components - sdk._timestamps.render,
          initialComponentRenderMs:
            sdk._timestamps.componentsEnd - sdk._timestamps.components,
        };
        if (shouldLogLoadingTime) {
          // eslint-disable-next-line no-console
          console.log('sdk-startup-performance', value);
        }
        logEvent('sdk-startup-performance', value);
      }
    }
  }, [sdk._timestamps, logEvent]);

  return (
    <>
      {components.map((component) => (
        <ErrorHandler key={component.componentID}>
          <ComponentWrapper
            key={component.componentID}
            component={component}
            {...{ [CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE]: false }}
          />
        </ErrorHandler>
      ))}
    </>
  );
}
function ComponentWrapper({ component }: { component: IPrivateCordComponent }) {
  const forceRender = useForceRender();

  useEffect(() => {
    // When the component props change, force a re-render, but use setTimeout to
    // make sure it happens *after* processing the current events: when multiple
    // props are changed, React updates them one-by-one; if we call forceRender
    // immediately, we will render a component with its props in an inconsistent
    // in-between state, which can lead to confusing behaviour.
    component.onPropsChanged = () => setTimeout(forceRender);
    return () => (component.onPropsChanged = undefined);
  }, [component, forceRender]);

  const componentProps = component.props;

  const componentContextValue = useMemo(
    () => ({
      // If a Cord component `wrapsDom = true`, we don't attach the ShadowRoot to the component itself,
      // but to a nested `div` inside of it. In this case, we should Portal to that `div` rather than the component.
      element:
        (component.querySelector(
          `[${CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE}]`,
        ) as HTMLCordElement) ?? component,
      name: component.nodeName.toLowerCase() as ElementName,
      props: componentProps as Record<string, unknown>,
    }),
    [component, componentProps],
  );

  return (
    <ComponentContext.Provider value={componentContextValue}>
      {createPortal(
        <ErrorHandler>
          <PortalContext.Provider value={component.renderTarget}>
            <JssInjector
              rootElement={component.renderTarget}
              fontFamily="inherit"
              resetCss={component.useShadowRoot}
            >
              <NewComponentSwitchContext.Provider
                value={
                  component.useShadowRoot
                    ? component.newComponentSwitchConfig
                    : ENABLE_ALL_NEW_COMPONENTS_CONFIG
                }
              >
                <ComponentGlobalEventsProvider>
                  <MediaModalProvider fullWidth={true}>
                    <ResizeObserverProvider>
                      {component.render()}
                    </ResizeObserverProvider>
                  </MediaModalProvider>
                </ComponentGlobalEventsProvider>
              </NewComponentSwitchContext.Provider>
            </JssInjector>
          </PortalContext.Provider>
        </ErrorHandler>,
        component.useShadowRoot ? component.renderTarget : component,
      )}
    </ComponentContext.Provider>
  );
}

export function App(props: AppProps) {
  const [components, addComponent, deleteComponent] = useComponentList(
    props.initialComponents,
  );

  useEffect(() => {
    if (!props.enableAnnotations) {
      return;
    }

    if (
      components.find((c) =>
        ['CORD-SIDEBAR', 'CORD-FLOATING-THREADS'].includes(c.nodeName),
      )
    ) {
      // This enables cross-iframe annotations to work.
      watchAccessibleIFramesAndInjectCord();
    }
  }, [components, props.enableAnnotations]);

  const { setRegisterComponentCallback, setUnregisterComponentCallback } =
    props;

  useEffect(() => {
    setRegisterComponentCallback(addComponent);
    return () => {
      setRegisterComponentCallback(undefined);
    };
  }, [setRegisterComponentCallback, addComponent]);

  useEffect(() => {
    setUnregisterComponentCallback(deleteComponent);
    return () => {
      setUnregisterComponentCallback(undefined);
    };
  }, [setUnregisterComponentCallback, deleteComponent]);

  const enableScreenshotCaptureFeatureFlag = useFeatureFlag(
    FeatureFlags.ENABLE_ANNOTATIONS_SCREENSHOTS,
  );
  const enableSentry = useFeatureFlag(FeatureFlags.ENABLE_SENTRY);
  useEffect(() => {
    if (enableSentry) {
      initSentry();
    }
  }, [enableSentry]);

  const {
    enableTasks,
    enableAnnotations,
    enableSlack,
    threadOptions,
    screenshotOptions,
    customRenderers,
    customEventMetadata,
    beforeMessageCreate,
  } = props;
  const configValues = useMemo(
    () => ({
      ...(enableTasks !== undefined && { enableTasks }),
      ...(enableAnnotations !== undefined && { enableAnnotations }),
      ...(enableSlack !== undefined && { enableSlack }),
      ...(threadOptions !== undefined && { threadOptions }),
      ...(customEventMetadata !== undefined && { customEventMetadata }),
      ...(screenshotOptions !== undefined && {
        screenshotOptions: {
          ...screenshotOptions,
          captureWhen: !enableScreenshotCaptureFeatureFlag
            ? []
            : screenshotOptions.captureWhen,
        },
      }),
      beforeMessageCreate: beforeMessageCreate ?? undefined,
      customRenderers,
    }),
    [
      enableTasks,
      enableAnnotations,
      enableSlack,
      threadOptions,
      customEventMetadata,
      screenshotOptions,
      enableScreenshotCaptureFeatureFlag,
      customRenderers,
      beforeMessageCreate,
    ],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    /**
     * TODO(am): Remove this provider when all our components that can send a message
     * will have their own `ScreenshotConfigProvider`
     */
    <ScreenshotConfigContext.Provider value={undefined}>
      <PartialConfigurationProvider config={configValues}>
        <SlackRemovalProvider>
          <TasksRemovalProvider>
            <PageUrlProvider>
              <PageContextProvider>
                <ErrorHandler disabled={!enableSentry}>
                  <GlobalProvider>
                    <PinnedAnnotationsProvider>
                      <FloatingThreadsProvider>
                        <DelegateProvider
                          iframeRef={iframeRef}
                          thirdPartyInstances={props.thirdPartyInstances}
                          navigate={props.navigate}
                        >
                          <ThreadsProvider2 location="elsewhere">
                            <NotificationsProvider>
                              <NavigationOverrideProvider
                                navigate={props.navigate}
                              >
                                <MemoryRouter>
                                  {props.children}
                                  <Components components={components} />
                                </MemoryRouter>
                              </NavigationOverrideProvider>
                            </NotificationsProvider>
                          </ThreadsProvider2>
                          <DocumentControllerSDK />
                        </DelegateProvider>
                      </FloatingThreadsProvider>
                    </PinnedAnnotationsProvider>
                  </GlobalProvider>
                </ErrorHandler>
              </PageContextProvider>
            </PageUrlProvider>
          </TasksRemovalProvider>
        </SlackRemovalProvider>
      </PartialConfigurationProvider>
    </ScreenshotConfigContext.Provider>
  );
}

function DocumentControllerSDK() {
  const [renderTarget, setRenderTarget] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const maybeRootElement = document.getElementById(ACTION_MODAL_ID);
    if (maybeRootElement && maybeRootElement instanceof HTMLDivElement) {
      setRenderTarget(maybeRootElement);
    } else {
      const rootElement = document.createElement('div');
      rootElement.id = ACTION_MODAL_ID;
      document.body.appendChild(rootElement);
      rootElement.classList.add(CORD_COMPONENT_BASE_CLASS, CORD_V1);
      setRenderTarget(rootElement);
    }
  }, []);

  return (
    <>
      {renderTarget && (
        <PortalContext.Provider value={renderTarget}>
          <Portal>
            <DisabledSidebarWidthProvider>
              <DocumentController />
            </DisabledSidebarWidthProvider>
          </Portal>
        </PortalContext.Provider>
      )}
    </>
  );
}
