import * as React from 'react';
import { memo, useMemo, useContext as unsafeUseContext } from 'react';
import { jss } from 'react-jss';

import type { InboxReactComponentProps } from '@cord-sdk/react';

import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { InboxCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import { InboxWrapper } from 'external/src/components/2/InboxWrapper2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { InboxProvider } from 'external/src/context/inbox/InboxProvider.tsx';
import { DisabledAnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { DisabledThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { DisabledAnnotationPillDisplayProvider } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

export const INBOX_HOST_STYLE = {
  '@global': {
    ':host, cord-inbox': {
      display: 'block',
      backgroundColor: cssVar('inbox-background-color'),
      border: cssVar('inbox-border'),
      borderRadius: cssVar('inbox-border-radius'),
      minWidth: '250px',
      width: cssVar('inbox-width'),
      height: cssVar('inbox-height'),
      // to not let nested boxes clip the borders (see PR 861)
      overflow: 'auto',
    },
    // These styles need to be applied after the above ones,
    // because `cord-inbox` needs to have `display: flex`.
    ':host > div, cord-inbox': {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    ':host > div': {
      height: '100%',
    },
  },
};

function Inbox({
  showCloseButton = true,
  onCloseRequested,
  showSettings = true,
  internalHostStyles = true,
  showPlaceholder = true,
}: InboxReactComponentProps & { internalHostStyles?: boolean }) {
  const inboxStyles = useMemo(
    () => jss.createStyleSheet(INBOX_HOST_STYLE).toString(),
    [],
  );

  // We might already have a provider, if this Inbox is rendered by
  // the InboxLauncher. In that case, don't add another provider to
  // not fire query twice (once per provider).
  const providerAlreadyExists =
    unsafeUseContext(InboxContext) !== NO_PROVIDER_DEFINED;
  const MaybeInboxProvider = providerAlreadyExists
    ? React.Fragment
    : InboxProvider;

  return (
    <CSSVariableOverrideContext.Provider value={InboxCSSOverrides}>
      {internalHostStyles && <style>{inboxStyles}</style>}
      <GlobalElementProvider>
        <MaybeInboxProvider>
          <PagePresenceAndVisitorsShim>
            <DisabledAnnotationsOnPageProvider>
              <AnnotationsConfigProvider showPinsOnPage={false}>
                <DisabledThreadListContext>
                  <DisabledAnnotationPillDisplayProvider>
                    <InboxWrapper
                      closeInbox={() => {
                        onCloseRequested?.();
                      }}
                      showCloseButton={showCloseButton}
                      showSettings={showSettings}
                      showAllActivity={false}
                      showPlaceholder={showPlaceholder}
                    />
                  </DisabledAnnotationPillDisplayProvider>
                </DisabledThreadListContext>
              </AnnotationsConfigProvider>
            </DisabledAnnotationsOnPageProvider>
          </PagePresenceAndVisitorsShim>
        </MaybeInboxProvider>
      </GlobalElementProvider>
    </CSSVariableOverrideContext.Provider>
  );
}

// TODO: make this automatic
export default memo(Inbox);
