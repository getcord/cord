/** @jsxImportSource @emotion/react */

import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import apiData from 'docs/server/apiData/apiData.ts';

const uri = '/js-apis-and-hooks/thread-api/observeThreads';
const title = 'Get threads';
const subtitle =
  'Build thread previews with detailed data about all threads visible to the current user';

const jsMethodData =
  apiData.types.ICordThreadSDK.methods.methods.observeThreads;
const reactMethodData = apiData.react.thread.useThreads;

function ThreadObserveThreads() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.ThreadsData.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadObserveThreads,
};
