import { CordProvider } from '@cord-sdk/react';
import type { NavigateFn, Translations } from '@cord-sdk/types';
import { useRef } from 'react';
import * as ReactDOM from 'react-dom/client';
import Dashboard from '../components/Dashboard';
import '../css/index.css';
import '../css/highcharts.css';
import '../css/aggrid.css';
import '../css/threads-toggle.css';
import {
  useCordDemoRooms,
  useCordDemoAppsToken,
  useIsWebsiteDemo,
  useWebsiteToken,
} from '../../../../../demo-apps/util';
import './demo-apps.css';
import './website.css';
import { ThreadsProvider } from '../ThreadsContext';
import { handleBeforeMessageCreate } from '../utils';

function App() {
  const isWebsiteDemo = useIsWebsiteDemo();
  return isWebsiteDemo ? <WebsiteDemo /> : <DocsDemo />;
}

/** Stripped down version of the full Docs demo */
function WebsiteDemo() {
  const authToken = useWebsiteToken();
  return (
    <CordDashboard
      clientAuthToken={authToken}
      delayAutofocus
      highchartsDataSeries={[{ start: 2012, end: 2022 }]}
      translations={{
        en: {
          thread: {
            placeholder_title: 'Add a comment',
            placeholder_body:
              'Try Cord’s commenting features right here. Your comments are private, and only you will see them.',
          },
        },
      }}
    />
  );
}

function DocsDemo() {
  useCordDemoRooms();
  const cordAuthToken = useCordDemoAppsToken();
  return (
    <CordDashboard
      clientAuthToken={cordAuthToken}
      translations={{
        en: {
          thread: {
            placeholder_title: 'Add a comment',
            placeholder_body:
              'Try Cord’s commenting features right here. Comments can be seen by anyone you share this demo with.',
          },
        },
      }}
    />
  );
}

function CordDashboard({
  clientAuthToken,
  delayAutofocus = false,
  highchartsDataSeries,
  translations,
}: {
  clientAuthToken: string | null;
  delayAutofocus?: boolean;
  highchartsDataSeries?: { start: number; end: number }[];
  translations: Translations;
}) {
  const navigateRef = useRef<NavigateFn | null>(null);

  return (
    <CordProvider
      cordScriptUrl={`https://${process.env.APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
      clientAuthToken={clientAuthToken}
      navigate={(...args) => navigateRef.current?.(...args) ?? false}
      translations={translations}
      beforeMessageCreate={handleBeforeMessageCreate}
      screenshotOptions={{
        captureWhen: ['new-message', 'new-thread'],
      }}
      onInitError={(e) =>
        console.error('Error when initializing Cord sdk: ', e)
      }
    >
      {clientAuthToken && (
        <ThreadsProvider delayAutofocus={delayAutofocus}>
          <Dashboard
            navigateRef={navigateRef}
            highchartsDataSeries={highchartsDataSeries}
          />
        </ThreadsProvider>
      )}
    </CordProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
