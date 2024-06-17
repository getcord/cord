/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useState } from 'react';
import { Thread } from '@cord-sdk/react';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  LIVE_CSS_ON_DOCS_THREAD_ID_PREFIX,
} from 'common/const/Ids.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { CustomCSSConfigType } from 'docs/server/routes/getStarted/liveCSSEditor/App.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';

const styles = {
  componentArea: {
    display: 'flex',
    justifyContent: 'start',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0',
    fontFamily: cssVar('font-family'),
    width: '100%',
    borderRadius: '4px',

    '&.light': {
      backgroundColor: '#F6F6F6',
    },
    '&.dark': {
      backgroundColor: '#696A6C',
    },
  },
  stickyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    position: 'sticky',
    // HACK HACK HACK, but it works:
    // Makes sure that the sticky box does not go below page navigation bar
    // If nav bar ever becomes thicker, this needs to change
    top: '100px',
  },
  thread: {
    display: 'block',
  },
  resetText: {
    cursor: 'pointer',
    '.light &': {
      color: '#696A6C',
    },
    '.dark &': {
      color: '#FFFFFF',
    },
  },
} as const;
type ComponentAreaProps = {
  customCSSConfig: CustomCSSConfigType;
  mode: 'light' | 'dark';
  forwardRef: React.Ref<HTMLDivElement>;
  resetToDefaults: null | (() => unknown);
};
export function ComponentArea({
  customCSSConfig,
  mode,
  forwardRef,
  resetToDefaults,
}: ComponentAreaProps) {
  return (
    <div className={mode} css={styles.componentArea} ref={forwardRef}>
      <ComponentContainer
        customCSSConfig={customCSSConfig}
        resetToDefaults={resetToDefaults}
      />
    </div>
  );
}

type ComponentContainerProps = Omit<ComponentAreaProps, 'forwardRef' | 'mode'>;

// separated this to ensure the area for the component renders first
// to prevent the elements from shifting on the page
function ComponentContainer({
  customCSSConfig,
  resetToDefaults,
}: ComponentContainerProps) {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_CSS_ON_DOCS_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  if (!threadID) {
    return null;
  }

  return (
    <div css={styles.stickyBox} style={customCSSConfig as React.CSSProperties}>
      <div style={{ fontFamily: cssVar('font-family') }}>
        <Thread
          css={styles.thread}
          location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveCss }}
          threadId={threadID}
          style={{ width: 300 }}
        />
      </div>
      {resetToDefaults && (
        <p css={styles.resetText} onClick={resetToDefaults}>
          Reset to defaults
        </p>
      )}
    </div>
  );
}
