/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/searchMessages';
const title = 'Search messages';
const subtitle = `Search messages the current user has access to`;

const jsMethodData =
  apiData.types.ICordThreadSDK.methods.methods.searchMessages;
const reactMethodData = apiData.react.thread.useSearchMessages;

function ThreadSearchMessages() {
  return (
    <JsApiPage
      parent={ThreadAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadSearchMessages,
};
