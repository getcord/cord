/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/shareThread';
const title = 'Share thread';
const subtitle = 'Share a thread via email or Slack';

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.shareThread;

function ThreadShareThread() {
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
  Element: ThreadShareThread,
};
