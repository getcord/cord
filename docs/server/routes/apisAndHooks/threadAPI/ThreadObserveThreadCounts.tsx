/** @jsxImportSource @emotion/react */

import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

const uri = '/js-apis-and-hooks/thread-api/observeThreadCounts';
const title = 'Get thread counts';
const subtitle =
  'Build thread previews with detailed counts about all threads visible to the current user';

const jsMethodData =
  apiData.types.ICordThreadSDK.methods.methods.observeThreadCounts;
const reactMethodData = apiData.react.thread.useThreadCounts;

function ThreadCountsAPI() {
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
        alt: 'Graphic showing example uses of the Cord Thread Counts API',
      }}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadCountsAPI,
};
