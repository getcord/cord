import { useContext, useMemo } from 'react';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import { thread } from '@cord-sdk/react';
import {
  THREADS_DEFAULT_SNIPPETS,
  ThreadsDefaultWrapper,
} from 'docs/server/routes/components/threads/demoComponents/DefaultThreads.tsx';
import {
  THREADS_HEADER_TOOLTIP_AND_COMPOSER_SNIPPETS,
  ThreadsWithHeaderTooltipAndComposerWrapper,
} from 'docs/server/routes/components/threads/demoComponents/ThreadsWithHeaderTooltipAndComposer.tsx';
import {
  THREADS_WITH_RESOLVED_TAB_SNIPPETS,
  ThreadsWithResolvedTabWrapper,
} from 'docs/server/routes/components/threads/demoComponents/ThreadsWithResovledTab.tsx';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';

export function ThreadsLiveDemoExamples() {
  const authContext = useContext(AuthContext);

  const threadsData = thread.useThreads({
    filter: { location: { page: DOCS_LIVE_PAGE_LOCATIONS.liveBetaV2Threads } },
  });

  const groupID = authContext.organizationID;

  const options = useMemo(() => {
    if (!groupID) {
      return null;
    }
    return {
      default: {
        element: <ThreadsDefaultWrapper threadsData={threadsData} />,
        code: THREADS_DEFAULT_SNIPPETS,
      },
      'header-with-tooltip-and-composer': {
        element: (
          <ThreadsWithHeaderTooltipAndComposerWrapper
            threadsData={threadsData}
          />
        ),
        code: THREADS_HEADER_TOOLTIP_AND_COMPOSER_SNIPPETS,
      },
      'with-resolved-tab': {
        element: <ThreadsWithResolvedTabWrapper groupID={groupID} />,
        code: THREADS_WITH_RESOLVED_TAB_SNIPPETS,
      },
    };
  }, [groupID, threadsData]);

  if (!threadsData || !options) {
    return null;
  }

  return <ComponentExampleCard options={options} />;
}
