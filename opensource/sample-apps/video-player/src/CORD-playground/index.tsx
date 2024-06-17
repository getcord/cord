import { CordProvider } from '@cord-sdk/react';
import type { Translations } from '@cord-sdk/types';
import * as ReactDOM from 'react-dom/client';
import '../css/index.css';
import {
  useCordDemoAppsToken,
  useCordDemoRooms,
  useIsWebsiteDemo,
  useWebsiteToken,
} from '../../../../../demo-apps/util';
import './demo-apps.css';
import './website.css';
import { VideoPlayer } from '../components/VideoPlayer';

function App() {
  const isWebsiteDemo = useIsWebsiteDemo();
  return isWebsiteDemo ? <WebsiteDemo /> : <DocsDemo />;
}

/** Stripped down version of the full Docs demo */
function WebsiteDemo() {
  const authToken = useWebsiteToken();
  return (
    <CordVideoPlayer
      clientAuthToken={authToken}
      delayAutofocus
      video={
        'https://cdn.cord.com/cord-website-video/cord-website-video-with-subs-square.mp4'
      }
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
    <CordVideoPlayer
      clientAuthToken={cordAuthToken}
      video={
        'https://cdn.cord.com/cord-website-video/cord-website-video-with-subs-1080p.mp4'
      }
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

function CordVideoPlayer({
  clientAuthToken,
  delayAutofocus = false,
  video,
  translations,
}: {
  clientAuthToken: string | null;
  delayAutofocus?: boolean;
  video: string;
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
        <VideoPlayer video={video} delayAutofocus={delayAutofocus} />
      )}
    </CordProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
