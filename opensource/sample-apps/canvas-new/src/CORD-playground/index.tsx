import { CordProvider } from '@cord-sdk/react';
import * as ReactDOM from 'react-dom/client';

import '../css/index.css';
import {
  useCordDemoRooms,
  useCordDemoAppsToken,
} from '../../../../../demo-apps/util';
import './demo-apps.css';
import { CanvasAndCommentsProvider } from '../CanvasAndCommentsContext';
import { EXAMPLE_CORD_LOCATION } from '../canvasUtils/common';
import { CanvasWindow } from '../components/CanvasWindow';

function App() {
  useCordDemoRooms();
  const cordAuthToken = useCordDemoAppsToken();
  return (
    <CordProvider
      cordScriptUrl={`https://${process.env.APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
      clientAuthToken={cordAuthToken}
      screenshotOptions={{
        captureWhen: ['new-message', 'new-thread'],
      }}
      onInitError={(e) =>
        console.error('Error when initializing Cord sdk: ', e)
      }
    >
      <CanvasAndCommentsProvider location={EXAMPLE_CORD_LOCATION}>
        {cordAuthToken && <CanvasWindow />}
      </CanvasAndCommentsProvider>
    </CordProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
