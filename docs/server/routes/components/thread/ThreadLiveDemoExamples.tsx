import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { BETA_V2_DOCS_PREFIX } from 'common/const/Ids.ts';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import { thread } from '@cord-sdk/react';
import {
  THREAD_DEFAULT_SNIPPETS,
  ThreadDefaultWrapper,
} from 'docs/server/routes/components/thread/demoComponents/ThreadDefault.tsx';
import {
  THREAD_MESSENGER_LAYOUT_SNIPPETS,
  ThreadMessengerLayoutWrapper,
} from 'docs/server/routes/components/thread/demoComponents/ThreadMessengerLayout.tsx';
import {
  THREAD_ADD_BUTTON_TO_MENTION_MENU_SNIPPETS,
  ThreadAddButtonToMentionMenuWrapper,
} from 'docs/server/routes/components/thread/demoComponents/ThreadAddButtonToMentionMenu.tsx';
import {
  THREAD_WITH_GIPHY_SNIPPETS,
  ThreadWithGiphyWrapper,
} from 'docs/server/routes/components/thread/demoComponents/ThreadWithGiphy.tsx';

export function ThreadLiveDemoExamples() {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);

  useEffect(() => {
    setThreadID(
      `${BETA_V2_DOCS_PREFIX}thread-example-${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  const threadData = thread.useThread(threadID, { skip: !threadID });

  const options = useMemo(() => {
    if (!threadData) {
      return null;
    }
    return {
      default: {
        element: <ThreadDefaultWrapper threadData={threadData} />,
        code: THREAD_DEFAULT_SNIPPETS,
      },
      'add-button-to-mention-menu': {
        element: (
          <ThreadAddButtonToMentionMenuWrapper threadData={threadData} />
        ),
        code: THREAD_ADD_BUTTON_TO_MENTION_MENU_SNIPPETS,
      },
      'add-giphy-integration': {
        element: <ThreadWithGiphyWrapper threadData={threadData} />,
        code: THREAD_WITH_GIPHY_SNIPPETS,
      },
      'messenger-layout': {
        element: <ThreadMessengerLayoutWrapper threadData={threadData} />,
        code: THREAD_MESSENGER_LAYOUT_SNIPPETS,
      },
    };
  }, [threadData]);

  if (!threadID || !threadData || !options) {
    return null;
  }

  return <ComponentExampleCard options={options} />;
}
