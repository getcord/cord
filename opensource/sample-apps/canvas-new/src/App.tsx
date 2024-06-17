import { CordProvider } from '@cord-sdk/react';

import { InformationHeader } from '../../_common/InformationHeader';
import { CanvasAndCommentsProvider } from './CanvasAndCommentsContext';
import { CanvasWindow } from './components/CanvasWindow';
import { useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION } from './utils';
import { EXAMPLE_CORD_LOCATION } from './canvasUtils/common';
// The demo token is only used on cord.com where there are pre-populated users
// and messages, you can ignore it!
import { prepopulatedDemoToken } from './prepopulatedDemoToken.json';

export default function App() {
  // This must be replaced with your code that obtains the client auth token
  // from your own backend, signed with your own API secret.
  const sampleToken = useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION();
  const clientAuthToken = prepopulatedDemoToken ?? sampleToken;

  return (
    // All the Cord React components must be children of a single CordProvider component.
    <CordProvider
      clientAuthToken={clientAuthToken}
      translations={{
        en: {
          thread: {
            placeholder_title: '',
            placeholder_body:
              'Give feedback, ask a question, or just leave a note of appreciation. Get the conversation started by adding a new comment.',
          },
        },
      }}
      screenshotOptions={{
        captureWhen: ['new-message', 'new-thread'],
      }}
      onInitError={(e) =>
        console.error('Error when initializing Cord sdk: ', e)
      }
    >
      <InformationHeader
        components={[
          'cord-avatar',
          'cord-message',
          'cord-thread',
          'cord-threaded-comments',
          'cord-page-presence',
        ]}
        api={['thread', 'user']}
        app="canvas-new"
      />
      {clientAuthToken && (
        <CanvasAndCommentsProvider location={EXAMPLE_CORD_LOCATION}>
          <CanvasWindow />
        </CanvasAndCommentsProvider>
      )}
    </CordProvider>
  );
}
