/** @jsxImportSource @emotion/react */

import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/thread-api/observeThread';
const title = 'Get a single thread';
const subtitle =
  'Build rich integrations with detailed data about one thread and all of its messages';

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.observeThread;
const reactMethodData = apiData.react.thread.useThread;

function ThreadObserveThread() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.ClientThreadData.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadObserveThread,
};
