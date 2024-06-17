/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/sendMessage';
const title = 'Send a new message';
const subtitle = 'Add a message to a thread or create a new one';

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.sendMessage;

function ThreadSendMessage() {
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
  Element: ThreadSendMessage,
};
