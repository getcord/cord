/** @jsxImportSource @emotion/react */

import DemoAppHeader from 'docs/server/routes/getStarted/demoApps/ui/DemoAppHeader.tsx';
import { APP_SERVER_HOST } from 'common/const/Urls.ts';
import { usePrepareMiniApp } from 'docs/server/MiniApp.tsx';
import ClientSideRender from 'docs/server/ClientRenderWrapper.tsx';

function Dashboard() {
  return (
    <>
      {/* Hack: Because we are fetching the js and css for the
       demo app separately, the page will just be empty (white) 
       for a split second before it loads. This sudden flash looks bad. 
       So we set the initial background color to the color of the demo app.
       
       Please take care to update the body color in the demo app styles if
       you change this. 
       */}
      <style>
        {`body {
            --dashboard-bg-color: #302c2c;
            background-color: var(--dashboard-bg-color);
          }`}
      </style>
      <DemoAppHeader
        title="Dashboard Demo App"
        components={[
          'cord-thread',
          'cord-notification-list-launcher',
          'cord-threaded-comments',
          'cord-presence-facepile',
          'cord-presence-observer',
          'cord-page-presence',
        ]}
        api={['thread', 'user']}
        darkMode
        app="dashboard"
        description="See how you can add commenting to your dashboard app using the Cord chat components"
      />
      <ClientSideRender>
        <DashboardApp />
      </ClientSideRender>
    </>
  );
}

function DashboardApp() {
  usePrepareMiniApp(
    `https://${APP_SERVER_HOST}/playground/dashboard/dashboard.css`,
    `https://${APP_SERVER_HOST}/playground/dashboard/dashboard.js`,
  );
  return <div></div>;
}

export default Dashboard;
