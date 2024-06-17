/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/createThread';
const title = 'Create a new thread';
const subtitle = 'Create a thread without messages';

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.createThread;

function ThreadCreateThread() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadCreateThread,
};
