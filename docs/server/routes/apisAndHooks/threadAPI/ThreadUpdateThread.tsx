/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';

const uri = '/js-apis-and-hooks/thread-api/updateThread';
const title = 'Update thread properties';
const subtitle = 'Change the properties of an existing thread';

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.updateThread;

function ThreadUpdateThread() {
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
  Element: ThreadUpdateThread,
};
