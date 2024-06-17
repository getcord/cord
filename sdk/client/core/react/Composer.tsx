import { memo, useCallback, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import type { ComposerReactComponentProps } from '@cord-sdk/react';

import { MaybeThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { ComposerProvider } from 'external/src/context/composer/ComposerProvider.tsx';
import type { Thread2ContextType } from 'external/src/context/thread2/Thread2Context.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { DisabledAnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import type { ComposerSize, EntityMetadata } from '@cord-sdk/types';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import type { UUID } from 'common/types/index.ts';
import { cordifyClassname } from 'common/ui/style.ts';
import {
  OrgOverrideProvider,
  OrganizationContext,
} from 'external/src/context/organization/OrganizationContext.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

function Composer({
  context,
  location,
  threadId,
  threadName,
  threadUrl,
  autofocus,
  disabled,
  messageMetadata,
  threadMetadata,
  showExpanded,
  showCloseButton,
  size,
  groupId,
}: ComposerReactComponentProps) {
  return (
    <OrgOverrideProvider externalOrgID={groupId}>
      <ComponentPageContextProvider location={location ?? context}>
        <MaybeThreadNameContext threadName={threadName}>
          <DisabledAnnotationsOnPageProvider>
            <DisabledCSSVariableOverrideContextProvider>
              <ComposerImpl
                externalThreadID={threadId}
                shouldFocusOnMount={autofocus}
                disabled={disabled}
                showExpanded={showExpanded}
                showCloseButton={showCloseButton}
                size={size}
                threadUrl={threadUrl}
                messageMetadata={messageMetadata}
                threadMetadata={threadMetadata}
              />
            </DisabledCSSVariableOverrideContextProvider>
          </DisabledAnnotationsOnPageProvider>
        </MaybeThreadNameContext>
      </ComponentPageContextProvider>
    </OrgOverrideProvider>
  );
}

function ComposerImpl({
  externalThreadID,
  shouldFocusOnMount = false,
  disabled,
  showExpanded = false,
  showCloseButton = false,
  size = 'medium',
  threadUrl,
  messageMetadata,
  threadMetadata,
}: {
  externalThreadID: string | undefined;
  shouldFocusOnMount?: boolean;
  disabled?: boolean;
  showExpanded?: boolean;
  showCloseButton?: boolean;
  size?: ComposerSize;
  threadUrl?: string;
  messageMetadata?: EntityMetadata;
  threadMetadata?: EntityMetadata;
}) {
  const {
    thread: threadToRender,
    threadID,
    loading,
  } = useThreadByExternalID(externalThreadID);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const [nextNewThreadID, setNextNewThreadID] = useState<UUID>(uuid());
  const composerThreadID = threadID ?? nextNewThreadID;
  const onSendMessageOfANewThread = useCallback(
    () => setNextNewThreadID(uuid()),
    [],
  );

  const threadContextValue: Thread2ContextType = {
    threadID: composerThreadID,
    externalThreadID: externalThreadID ?? null,
    threadMode: threadToRender ? 'fullHeight' : 'newThread',
    initialSlackShareChannel: null,
    thread: threadToRender ?? null,
  };

  const composerRef = useRef<HTMLDivElement>(null);

  const createNewThread = !threadToRender;
  const groupID = organization?.id;

  if (createNewThread && !groupID) {
    throw new Error('Must specify a groupId if creating a new thread');
  }

  return (
    <Thread2Context.Provider value={threadContextValue}>
      {/* This wrapper div exists so that all toasts appear in 
          inside the composer */}
      <div
        className={cordifyClassname('composer-toast-container')}
        style={{ position: 'relative' }}
      >
        <GlobalElementProvider toastSize={'s'}>
          <PagePresenceAndVisitorsShim>
            <ComposerProvider>
              <Composer3
                shouldFocusOnMount={shouldFocusOnMount}
                disabled={disabled}
                showBorder={true}
                showExpanded={showExpanded}
                forwardRef={composerRef}
                showCloseButton={showCloseButton}
                onSendMessage={
                  threadToRender ? undefined : onSendMessageOfANewThread
                }
                loading={loading}
                size={size}
                threadUrl={threadUrl}
                messageMetadata={messageMetadata}
                threadMetadata={threadMetadata}
              />
            </ComposerProvider>
          </PagePresenceAndVisitorsShim>
        </GlobalElementProvider>
      </div>
    </Thread2Context.Provider>
  );
}

// TODO: make this automatic
export default memo(Composer);
