/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/notification-api/observeNotifications';
const title = 'Observe full notification data';
const subtitle =
  'How to use the notification API to observe full notification data';

const jsMethodData =
  apiData['types']['ICordNotificationSDK']['methods']['methods'][
    'observeNotifications'
  ];
const reactMethodData = apiData['react']['notification']['useNotifications'];

function NotificationObserveNotifications() {
  return (
    <JsApiPage
      parent={NotificationAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.CoreNotificationData.properties}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: NotificationObserveNotifications,
};
