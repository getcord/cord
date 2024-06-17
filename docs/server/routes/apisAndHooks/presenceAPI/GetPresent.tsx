/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import PresenceAPI from 'docs/server/routes/apisAndHooks/presenceAPI/PresenceAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/presence-api/getPresent';
const title = 'Observe users present at a location';
const subtitle =
  'How to use the presence API to observe users present at a location';

const jsMethodData =
  apiData['types']['ICordPresenceSDK'].methods.methods['observePresence'];
const reactMethodData = apiData['react']['presence']['usePresence'];

function GetPresent() {
  return (
    <JsApiPage
      parent={PresenceAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.UserLocationData.properties}
      availableDataType="array"
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: GetPresent,
};
