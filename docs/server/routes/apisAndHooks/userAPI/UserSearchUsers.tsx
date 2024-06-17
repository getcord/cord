/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/user-api/searchUsers';
const title = 'Search for users in your groups';
const subtitle = 'Filter users down using various options';

const jsMethodData =
  apiData['types']['ICordUserSDK'].methods.methods['searchUsers'];
const reactMethodData = apiData['react']['user']['useSearchUsers'];

function UserSearchUsers() {
  return (
    <JsApiPage
      parent={UserAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.SearchUsersResult.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: UserSearchUsers,
};
