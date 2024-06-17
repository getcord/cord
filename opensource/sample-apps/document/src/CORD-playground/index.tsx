import { CordProvider } from '@cord-sdk/react';
import type { Translations } from '@cord-sdk/types';
import * as ReactDOM from 'react-dom/client';
import '../css/document.css';
import {
  useCordDemoRooms,
  useCordDemoAppsToken,
  useIsWebsiteDemo,
  useWebsiteToken,
} from '../../../../../demo-apps/util';
import { Document } from '../components/Document';
import { ThreadsProvider } from '../ThreadsContext';
import './website.css';
import './demo-apps.css';

function App() {
  const isWebsiteDemo = useIsWebsiteDemo();
  return isWebsiteDemo ? <WebsiteDemo /> : <DocsDemo />;
}

/** Stripped down version of the full Docs demo */
function WebsiteDemo() {
  const authToken = useWebsiteToken();
  return (
    <CordDocument
      clientAuthToken={authToken}
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
    <CordDocument
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

function CordDocument({
  clientAuthToken,
  translations,
}: {
  clientAuthToken: string | null;
  translations: Translations;
}) {
  return (
    <CordProvider
      cordScriptUrl={`https://${process.env.APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
      clientAuthToken={clientAuthToken}
      translations={translations}
      screenshotOptions={{
        captureWhen: ['new-message', 'new-thread'],
      }}
      onInitError={(e) =>
        console.error('Error when initializing Cord sdk: ', e)
      }
    >
      {clientAuthToken && (
        <ThreadsProvider>
          <Document />
        </ThreadsProvider>
      )}
    </CordProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
