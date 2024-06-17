/** @jsxImportSource @emotion/react */

import DemoAppHeader from 'docs/server/routes/getStarted/demoApps/ui/DemoAppHeader.tsx';
import { APP_SERVER_HOST } from 'common/const/Urls.ts';
import { usePrepareMiniApp } from 'docs/server/MiniApp.tsx';
import ClientSideRender from 'docs/server/ClientRenderWrapper.tsx';

function CanvasNew() {
  return (
    <div>
      {/* Hack: Because we are fetching the js and css for the
       demo app separately, the page will just be empty (white) 
       for a split second before it loads. This sudden flash looks bad. 
       So we set the initial background color to the color of the demo app.
       
       Please take care to update the body color in the demo app styles if
       you change this. 
       */}
      <style>
        {`body {
            --canvas-bg-color: #f8f4f4;
            background-color: var(--canvas-bg-color);
          }`}
      </style>
      <DemoAppHeader
        title="Canvas Demo App"
        components={[
          'cord-threaded-comments',
          'cord-page-presence',
          'cord-avatar',
          'cord-message',
          'cord-thread',
        ]}
        api={['annotations', 'thread']}
        description="See how you can add commenting into your canvas app using the Cord chat components"
        app="canvas-new"
      />
      <ClientSideRender>
        <CanvasNewApp />
      </ClientSideRender>
    </div>
  );
}

function CanvasNewApp() {
  usePrepareMiniApp(
    `https://${APP_SERVER_HOST}/playground/canvas-new/index.css`,
    `https://${APP_SERVER_HOST}/playground/canvas-new/index.js`,
  );
  return <div></div>;
}
export default CanvasNew;
