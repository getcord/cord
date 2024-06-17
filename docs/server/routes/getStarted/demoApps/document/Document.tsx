/** @jsxImportSource @emotion/react */

import DemoAppHeader from 'docs/server/routes/getStarted/demoApps/ui/DemoAppHeader.tsx';
import { APP_SERVER_HOST } from 'common/const/Urls.ts';
import { usePrepareMiniApp } from 'docs/server/MiniApp.tsx';
import ClientSideRender from 'docs/server/ClientRenderWrapper.tsx';

function Document() {
  return (
    <>
      {/* Hack: Because we are fetching the js and css for the
       demo app separately, the page will just be empty (white) 
       for a split second before it loads. This sudden flash looks bad. 
       So we set the initial background color to the color of the demo app.
       
       Please take care to update the body color in the demo app styles if
       you change this. 
       */}
      <style>{`body {
        --document-bg-color: #f8f4f4;
        background-color: var(--document-bg-color);
      }`}</style>
      <DemoAppHeader
        title="Document Demo App"
        components={[
          'cord-avatar',
          'cord-page-presence',
          'cord-thread',
          'cord-threaded-comments',
        ]}
        api={['presence', 'thread', 'user']}
        app="document"
        description="See how you can add commenting into your document app using the Cord chat components"
      />
      <ClientSideRender>
        <DocumentApp />
      </ClientSideRender>
    </>
  );
}

function DocumentApp() {
  usePrepareMiniApp(
    `https://${APP_SERVER_HOST}/playground/document/index.css`,
    `https://${APP_SERVER_HOST}/playground/document/index.js`,
  );

  return <div></div>;
}
export default Document;
