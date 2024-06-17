import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';
import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';

const uri = '/js-apis-and-hooks/notification-api/delete';
const title = 'Delete a notification';
const subtitle = 'How to use the notification API to remove a notification';

const jsMethodData =
  apiData['types']['ICordNotificationSDK']['methods']['methods']['delete'];

function NotificationDelete() {
  return (
    <JsApiPage
      parent={NotificationAPI}
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
  Element: NotificationDelete,
};
