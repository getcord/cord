/** @jsxImportSource @emotion/react */

import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

const uri = '/js-apis-and-hooks/thread-api/observeLocationData';
const title = 'Observe detailed location data';
const subtitle =
  'Build thread previews with detailed data about all threads in a location';

const jsMethodData =
  apiData.types.ICordThreadSDK.methods.methods.observeLocationData;
const reactMethodData = apiData.react.thread.useLocationData;

function ThreadObserveLocationData() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.LocationData.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadObserveLocationData,
};
