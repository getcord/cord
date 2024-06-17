/** @jsxImportSource @emotion/react */

import { useContext, useState } from 'react';
import { Pin } from '@cord-sdk/react';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import LiveDemoCardText from 'docs/server/ui/liveDemoCard/LiveDemoCardText.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import ChartExample from 'docs/server/routes/components/pin/ChartExample.tsx';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  LIVE_COMPONENT_ON_DOCS_PIN_THREAD_ID_PREFIX,
} from 'common/const/Ids.ts';

const location = {
  page: DOCS_LIVE_PAGE_LOCATIONS.livePin,
};
function PinLiveDemo() {
  const authContext = useContext(AuthContext);
  const [showChartDemo, setShowChartDemo] = useState(false);
  const orgID = authContext.organizationID;
  return (
    <LiveDemoCard>
      {orgID && (
        <>
          <div
            css={{
              flex: '1 1 0px',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {showChartDemo ? (
              <>
                <ChartExample />
                <LiveDemoCardText>
                  <p>
                    Click any point on the chart to leave a comment! Or{' '}
                    <a onClick={() => setShowChartDemo((x) => !x)}>go back</a>{' '}
                    to just a single pin
                  </p>
                </LiveDemoCardText>
              </>
            ) : (
              <>
                <Pin
                  location={location}
                  threadId={`${LIVE_COMPONENT_ON_DOCS_PIN_THREAD_ID_PREFIX}${authContext.organizationID}`}
                />
                <LiveDemoCardText
                  css={{ textAlign: 'center', marginTop: '24px' }}
                >
                  <p>
                    By itself, the pin is quite simple. Click{' '}
                    <a onClick={() => setShowChartDemo((x) => !x)}>here</a> to
                    see a how pin can be used to leave comments on a chart.
                  </p>
                </LiveDemoCardText>
              </>
            )}
          </div>
        </>
      )}
    </LiveDemoCard>
  );
}

export default PinLiveDemo;
