import { CordProvider } from '@cord-sdk/react';

import { InformationHeader } from '../../_common/InformationHeader';
import { useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION } from './utils';
import { VideoPlayer } from './components/VideoPlayer';
// The demo token is only used on cord.com where there are pre-populated users
// and messages, you can ignore it!
import { prepopulatedDemoToken } from './prepopulatedDemoToken.json';

export default function App() {
  const sampleToken = useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION();
  const clientAuthToken = prepopulatedDemoToken ?? sampleToken;

  return (
    // All the Cord React components must be children of a single CordProvider component.
    <CordProvider
      clientAuthToken={clientAuthToken}
      screenshotOptions={{
        captureWhen: ['new-message', 'new-thread'],
      }}
      onInitError={(e) =>
        console.error('Error when initializing Cord sdk: ', e)
      }
    >
      <InformationHeader
        components={[
          'cord-threaded-comments',
          'cord-thread',
          'cord-pin',
          'cord-page-presence',
          'cord-notification-list-launcher',
        ]}
        api={['thread']}
        app="video-player"
      />
      {clientAuthToken && (
        <VideoPlayer
          video={
            'https://cdn.cord.com/cord-website-video/cord-website-video-with-subs-1080p.mp4'
          }
        />
      )}
    </CordProvider>
  );
}
