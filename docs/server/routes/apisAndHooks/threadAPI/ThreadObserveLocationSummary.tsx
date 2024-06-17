/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/thread-api/observeLocationSummary';
const title = 'Observe location summary information';
const subtitle =
  'Build activity indicators and badges with information about a location and its threads';

const jsMethodData =
  apiData['types']['ICordThreadSDK'].methods.methods['observeLocationSummary'];
const reactMethodData = apiData['react']['thread']['useLocationSummary'];

function ThreadObserveLocationSummary() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.ThreadActivitySummary.properties}
      availableDataImage={{
        src: '/static/images/location-summary.png',
        alt: 'Graphic showing example uses of the Cord Location Summary API',
      }}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadObserveLocationSummary,
};
