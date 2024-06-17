/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/user-api/connectToSlack';
const title = 'Connect to Slack';
const subtitle = 'Allow users to connect to a Slack workspace';

const jsMethodData =
  apiData['types']['ICordUserSDK'].methods.methods['connectToSlack']
    .overloads[1];

function UserConnectToSlack() {
  return (
    <JsApiPage
      parent={UserAPI}
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
  Element: UserConnectToSlack,
};
