import { memo, useEffect, useMemo, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import type { SidebarReactComponentProps } from '@cord-sdk/react';
import { withGroupIDCheck } from '@cord-sdk/react/common/hoc/withGroupIDCheck.tsx';

import { SIDEBAR_CONTAINER_ID } from 'common/const/ElementIDs.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useSidebarVisibleSDK } from 'sdk/client/core/react/useSidebarVisibleSDK.ts';
import { Launcher } from 'external/src/delegate/components/Launcher.tsx';
import { SidebarConfigProvider } from 'external/src/context/sidebarConfig/SidebarConfigProvider.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { SidebarApp } from 'sdk/client/core/react/SidebarApp.tsx';
import { SidebarProviders } from 'sdk/client/core/react/SidebarProviders.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { SidebarCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { PinnedAnnotationPointers } from 'external/src/delegate/components/AnnotationPointers.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import {
  MediaModalContext,
  MediaModalProvider,
} from 'external/src/context/mediaModal/MediaModalContext.tsx';
import { AnnotationPointerAndArrow } from 'external/src/delegate/components/AnnotationPointerAndArrow.tsx';
import {
  ThirdPartyAuthDataModalContext,
  ThirdPartyAuthDataModalProvider,
} from 'external/src/context/thirdPartyAuthDataModal/ThirdPartyAuthModalContextProvider.tsx';
import { SidebarOverlay } from 'external/src/components/puppet/SidebarOverlay.tsx';
import { ThirdPartyAuthModal } from 'external/src/components/puppet/ThirdPartyAuthModal.tsx';
import type { MessageAnnotation } from 'common/types/index.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { CORD_AUTOMATED_TESTS_APPLICATION_ID } from 'common/const/Ids.ts';
import { useSendSampleWelcomeMessageMutation } from 'external/src/graphql/operations.ts';
import { useCordLocation } from 'sdk/client/core/react/useCordLocation.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { AnnotatingConfigProvider } from 'external/src/context/annotationConfig/AnnotatingConfigProvider.tsx';
import { AnnotatingConfigContext } from 'external/src/context/annotationConfig/AnnotatingConfigContext.ts';
import { AnnotationCreator } from 'external/src/delegate/components/AnnotationCreator.tsx';
import { MaybeThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { DisabledSidebarWidthProvider } from 'external/src/context/sidebarWidth/SidebarWidthProvider.tsx';
import { DisabledThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { DisabledAnnotationPillDisplayProvider } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { ScreenshotConfigProvider } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import {
  OrgOverrideProvider,
  OrganizationContext,
} from 'external/src/context/organization/OrganizationContext.tsx';

const useStyles = createUseStyles({
  floatingWrapper: {
    display: 'none',
    bottom: 0,
    overflow: 'hidden',
    position: 'fixed',
    right: 0,
    top: cssVar('sidebar-top'),
    zIndex: cssVar('sidebar-z-index'),
    width: cssVar('sidebar-width'),
    maxWidth: Sizes.SIDEBAR_MAX_WIDTH,
    minWidth: Sizes.SIDEBAR_COMPACT_WIDTH,
  },
  sidebarVisible: {
    display: 'block',
  },
  sidebarWrapper: {
    alignItems: 'stretch',
    backgroundColor: cssVar('sidebar-background-color'),
    borderBottom: cssVar('sidebar-border-bottom'),
    borderLeft: cssVar('sidebar-border-left'),
    borderRight: cssVar('sidebar-border-right'),
    borderTop: cssVar('sidebar-border-top'),
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

const SidebarWithProviders = withGroupIDCheck<SidebarReactComponentProps>(
  SidebarWithProvidersImpl,
  'Sidebar',
);

function SidebarWithProvidersImpl({
  context,
  location,
  showLauncher = true,
  showPresence = true,
  showPinsOnPage = true,
  excludeViewerFromPresence = false,
  showCloseButton = true,
  showInbox = true,
  open = true,
  threadName,
  screenshotConfig,
  groupId,
  onOpen,
  onClose,
  onThreadOpen,
  onThreadClose,
}: SidebarReactComponentProps) {
  return (
    <OrgOverrideProvider externalOrgID={groupId}>
      <ScreenshotConfigProvider screenshotConfig={screenshotConfig}>
        <AnnotatingConfigProvider>
          <ThirdPartyAuthDataModalProvider>
            <MediaModalProvider fullWidth={false}>
              <MaybeThreadNameContext threadName={threadName}>
                <Sidebar
                  context={context}
                  location={location}
                  showLauncher={showLauncher}
                  showPresence={showPresence}
                  showPinsOnPage={showPinsOnPage}
                  excludeViewerFromPresence={excludeViewerFromPresence}
                  showCloseButton={showCloseButton}
                  showInbox={showInbox}
                  open={open}
                  onOpen={onOpen}
                  onClose={onClose}
                  onThreadOpen={onThreadOpen}
                  onThreadClose={onThreadClose}
                />
              </MaybeThreadNameContext>
            </MediaModalProvider>
          </ThirdPartyAuthDataModalProvider>
        </AnnotatingConfigProvider>
      </ScreenshotConfigProvider>
    </OrgOverrideProvider>
  );
}

function Sidebar({
  context,
  location,
  showLauncher = true,
  showPresence = true,
  showPinsOnPage = true,
  excludeViewerFromPresence = false,
  showCloseButton = true,
  showInbox = true,
  open = true,
  onOpen,
  onClose,
  onThreadOpen,
  onThreadClose,
}: SidebarReactComponentProps) {
  const classes = useStyles();
  const {
    state: {
      annotationsVisible,
      annotationArrow,
      scrollingToAnnotation,
      thirdPartyObjects,
    },
  } = useContextThrowingIfNoProvider(DelegateContext);
  const annotation: MessageAnnotation | undefined = useMemo(
    () => Object.values(annotationsVisible)[0],
    [annotationsVisible],
  );

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const [sidebarVisible] = useSidebarVisibleSDK(open);

  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  const { annotatingConfig } = useContextThrowingIfNoProvider(
    AnnotatingConfigContext,
  );

  const { mediaModal: imageModal } =
    useContextThrowingIfNoProvider(MediaModalContext);

  const { thirdPartyAuthData, hideThirdPartyAuthDataModal } =
    useContextThrowingIfNoProvider(ThirdPartyAuthDataModalContext);

  const showAnnotationPointers =
    showPinsOnPage && !annotatingConfig && !imageModal;

  const applicationCtx = useContextThrowingIfNoProvider(ApplicationContext);
  const [sendSampleWelcomeMessage] = useSendSampleWelcomeMessageMutation();
  const cordLocation = useCordLocation(location ?? context);
  const cordLocationRef = useUpdatingRef(cordLocation);

  useEffect(() => {
    const isSampleTokenApplication =
      applicationCtx?.applicationEnvironment === 'sampletoken';
    const shouldSendWelcomeMessage =
      (applicationCtx?.applicationID &&
        applicationCtx?.applicationID ===
          CORD_AUTOMATED_TESTS_APPLICATION_ID) ||
      isSampleTokenApplication;

    if (shouldSendWelcomeMessage) {
      void sendSampleWelcomeMessage({
        variables: {
          messageLocation: cordLocationRef.current,
          url: window.location.toString(),
          _externalOrgID: organization?.externalID,
        },
      });
    }
  }, [
    applicationCtx?.applicationEnvironment,
    applicationCtx?.applicationID,
    cordLocationRef,
    organization?.externalID,
    sendSampleWelcomeMessage,
  ]);

  useEffect(() => {
    if (sidebarVisible) {
      const args: Parameters<NonNullable<typeof onOpen>>[0] = {};
      const width = sidebarContainerRef.current?.offsetWidth;
      if (width && width > 0) {
        args.width = width;
      }
      onOpen?.(args);
    } else {
      onClose?.();
    }
  }, [sidebarVisible, onOpen, onClose]);

  return (
    <CSSVariableOverrideContext.Provider value={SidebarCSSOverrides}>
      <SidebarConfigProvider
        showLauncher={showLauncher}
        showPresence={showPresence}
        showCloseButton={showCloseButton}
        showInbox={showInbox}
        excludeViewerFromPresence={excludeViewerFromPresence}
      >
        <AnnotationsConfigProvider showPinsOnPage={showPinsOnPage}>
          <DisabledSidebarWidthProvider>
            <DisabledThreadListContext>
              <DisabledAnnotationPillDisplayProvider>
                <SidebarProviders location={location ?? context}>
                  <div
                    className={cx(classes.floatingWrapper, {
                      [classes.sidebarVisible]: sidebarVisible,
                    })}
                    id={SIDEBAR_CONTAINER_ID}
                  >
                    <GlobalElementProvider>
                      <SidebarContainer forwardRef={sidebarContainerRef}>
                        <SidebarApp
                          sidebarContainerRef={sidebarContainerRef}
                          onThreadOpen={onThreadOpen}
                          onThreadClose={onThreadClose}
                        />
                        <AnnotationPointerAndArrow
                          annotation={annotation}
                          annotationArrow={annotationArrow}
                          scrollingToAnnotation={scrollingToAnnotation}
                          thirdPartyObjects={thirdPartyObjects}
                        />
                        {annotatingConfig && (
                          <AnnotationCreator {...annotatingConfig} />
                        )}

                        {showAnnotationPointers && (
                          <Portal>
                            {/** Portal needed to render outside the sidebar zIndex's stacking context. */}
                            <PinnedAnnotationPointers />
                          </Portal>
                        )}

                        {thirdPartyAuthData && (
                          <Portal>
                            <SidebarOverlay>
                              <ThirdPartyAuthModal
                                data={thirdPartyAuthData}
                                onCancel={hideThirdPartyAuthDataModal}
                                provider="slack"
                              />
                            </SidebarOverlay>
                          </Portal>
                        )}
                      </SidebarContainer>
                    </GlobalElementProvider>
                  </div>
                  <Launcher sidebarVisible={sidebarVisible} />
                </SidebarProviders>
              </DisabledAnnotationPillDisplayProvider>
            </DisabledThreadListContext>
          </DisabledSidebarWidthProvider>
        </AnnotationsConfigProvider>
      </SidebarConfigProvider>
    </CSSVariableOverrideContext.Provider>
  );
}

function SidebarContainer({
  forwardRef,
  children,
}: React.PropsWithChildren<{
  forwardRef: React.RefObject<HTMLDivElement> | null;
}>) {
  const classes = useStyles();

  return (
    <Box2 className={cx(classes.sidebarWrapper)} forwardRef={forwardRef}>
      {children}
    </Box2>
  );
}

// TODO: make this automatic
export default memo(SidebarWithProviders);
