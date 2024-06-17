/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/observeMessage';
const title = 'Get message data';
const subtitle = `Fetch data for a specific message`;

const jsMethodData =
  apiData.types.ICordThreadSDK.methods.methods.observeMessage;
const reactMethodData = apiData.react.thread.useMessage;
const availableData = apiData.types.ClientMessageData.properties;

function ThreadObserveMessage() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={availableData}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadObserveMessage,
};
