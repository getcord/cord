/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/user-api/observeGroupMembers';
const title = 'Observe group members';
const subtitle =
  "Observe data about the members of a specific or the viewer's current group";

const jsMethodData =
  apiData['types']['ICordUserSDK'].methods.methods['observeGroupMembers'];
const reactMethodData = apiData['react']['user']['useGroupMembers'];

function UserObserveOrgMembers() {
  return (
    <JsApiPage
      parent={UserAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.GroupMembersData.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: UserObserveOrgMembers,
};
