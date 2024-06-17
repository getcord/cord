/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/user-api/setNotificationPreferences';
const title = 'Set notification preferences';
const subtitle = 'Set viewer notification preferences from your UI';

const jsMethodData =
  apiData['types']['ICordUserSDK'].methods.methods[
    'setNotificationPreferences'
  ];

function UserSetNotificationPreferences() {
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
  Element: UserSetNotificationPreferences,
};
