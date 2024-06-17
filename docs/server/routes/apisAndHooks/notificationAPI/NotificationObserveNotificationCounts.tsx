/** @jsxImportSource @emotion/react */

import NotificationAPI from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationAPI.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import JsApiPage from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/notification-api/observeNotificationCounts';
const title = 'Observe notification summary information';
const subtitle =
  'How to use the notification API to observe the number of unread notifications';

const jsMethodData =
  apiData['types']['ICordNotificationSDK']['methods']['methods'][
    'observeNotificationCounts'
  ];
const reactMethodData =
  apiData['react']['notification']['useNotificationCounts'];

function NotificationObserveNotificationCounts() {
  return (
    <JsApiPage
      parent={NotificationAPI}
      title={title}
      subtitle={subtitle}
      jsMethodData={jsMethodData}
      reactMethodData={reactMethodData}
      availableData={apiData.types.NotificationSummary.properties}
      availableDataImage={{
        src: '/static/images/notification-summary.png',
        alt: 'Graphic showing example uses of the Cord Notification Counts API',
      }}
    />
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: NotificationObserveNotificationCounts,
};
