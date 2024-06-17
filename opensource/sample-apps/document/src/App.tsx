import { CordProvider } from '@cord-sdk/react';

import { InformationHeader } from '../../_common/InformationHeader';
import { useCordSampleToken_DEMO_ONLY_NOT_FOR_PRODUCTION } from './utils';
import { Document } from './components/Document';
import { ThreadsProvider } from './ThreadsContext';
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
        api={['presence', 'thread', 'user']}
        components={[
          'cord-avatar',
          'cord-page-presence',
          'cord-thread',
          'cord-threaded-comments',
        ]}
        app="document"
      />
      {clientAuthToken && (
        <ThreadsProvider>
          <Document />
        </ThreadsProvider>
      )}
    </CordProvider>
  );
}
