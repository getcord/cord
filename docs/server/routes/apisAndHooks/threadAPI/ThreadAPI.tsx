import Page from 'docs/server/ui/page/Page.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import ThreadUpdateThread from 'docs/server/routes/apisAndHooks/threadAPI/ThreadUpdateThread.tsx';
import ThreadSendMessage from 'docs/server/routes/apisAndHooks/threadAPI/ThreadSendMessage.tsx';
import ThreadSetSubscribed from 'docs/server/routes/apisAndHooks/threadAPI/ThreadSetSubscribed.tsx';
import ThreadUpdateMessage from 'docs/server/routes/apisAndHooks/threadAPI/ThreadUpdateMessage.tsx';
import ThreadSetSeen from 'docs/server/routes/apisAndHooks/threadAPI/ThreadSetSeen.tsx';
import ThreadSearchMessages from 'docs/server/routes/apisAndHooks/threadAPI/ThreadSearchMessages.tsx';
import ThreadObserveMessage from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveMessage.tsx';
import ThreadObserveThread from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveThread.tsx';
import ThreadObserveThreads from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveThreads.tsx';
import ThreadObserveThreadsCounts from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveThreadCounts.tsx';
import ThreadCreateThread from 'docs/server/routes/apisAndHooks/threadAPI/ThreadCreateThread.tsx';
import ThreadShareThread from 'docs/server/routes/apisAndHooks/threadAPI/ThreadShareThread.tsx';
const uri = '/js-apis-and-hooks/thread-api';
const title = 'Thread API';
const subtitle =
  'The thread API offers information about comments in a specific thread in your project.';

const navItems = [
  {
    name: ThreadObserveThreads.title,
    linkTo: ThreadObserveThreads.uri,
    description: ThreadObserveThreads.subtitle,
    component: <ThreadObserveThreads.Element />,
  },
  {
    name: ThreadObserveThreadsCounts.title,
    linkTo: ThreadObserveThreadsCounts.uri,
    description: ThreadObserveThreadsCounts.subtitle,
    component: <ThreadObserveThreadsCounts.Element />,
  },
  {
    name: ThreadObserveThread.title,
    linkTo: ThreadObserveThread.uri,
    description: ThreadObserveThread.subtitle,
    component: <ThreadObserveThread.Element />,
  },
  {
    name: ThreadCreateThread.title,
    linkTo: ThreadCreateThread.uri,
    description: ThreadCreateThread.subtitle,
    component: <ThreadCreateThread.Element />,
  },
  {
    name: ThreadObserveMessage.title,
    linkTo: ThreadObserveMessage.uri,
    description: ThreadObserveMessage.subtitle,
    component: <ThreadObserveMessage.Element />,
  },

  {
    name: ThreadSendMessage.title,
    linkTo: ThreadSendMessage.uri,
    description: ThreadSendMessage.subtitle,
    component: <ThreadSendMessage.Element />,
  },
  {
    name: ThreadUpdateThread.title,
    linkTo: ThreadUpdateThread.uri,
    description: ThreadUpdateThread.subtitle,
    component: <ThreadUpdateThread.Element />,
  },
  {
    name: ThreadUpdateMessage.title,
    linkTo: ThreadUpdateMessage.uri,
    description: ThreadUpdateMessage.subtitle,
    component: <ThreadUpdateMessage.Element />,
  },
  {
    name: ThreadSetSubscribed.title,
    linkTo: ThreadSetSubscribed.uri,
    description: ThreadSetSubscribed.subtitle,
    component: <ThreadSetSubscribed.Element />,
  },
  {
    name: ThreadSetSeen.title,
    linkTo: ThreadSetSeen.uri,
    description: ThreadSetSeen.subtitle,
    component: <ThreadSetSeen.Element />,
  },
  {
    name: ThreadSearchMessages.title,
    linkTo: ThreadSearchMessages.uri,
    description: ThreadSearchMessages.subtitle,
    component: <ThreadSearchMessages.Element />,
  },
  {
    name: ThreadShareThread.title,
    linkTo: ThreadShareThread.uri,
    description: ThreadShareThread.subtitle,
    component: <ThreadShareThread.Element />,
  },
];

function ThreadAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
    >
      <IndexCardTiles cardList={navItems} />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  navItems,
  Element: ThreadAPI,
};
