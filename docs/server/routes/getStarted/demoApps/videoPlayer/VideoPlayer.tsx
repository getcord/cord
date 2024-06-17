/** @jsxImportSource @emotion/react */

import DemoAppHeader from 'docs/server/routes/getStarted/demoApps/ui/DemoAppHeader.tsx';
import { APP_SERVER_HOST } from 'common/const/Urls.ts';
import { usePrepareMiniApp } from 'docs/server/MiniApp.tsx';
import ClientSideRender from 'docs/server/ClientRenderWrapper.tsx';

function VideoPlayer() {
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
        --video-player-bg-color: #f8f4f4;
        background-color: var(--video-player-bg-color);
      }`}</style>
      <DemoAppHeader
        title="Video player Demo App"
        components={[
          'cord-threaded-comments',
          'cord-thread',
          'cord-pin',
          'cord-page-presence',
          'cord-notification-list-launcher',
        ]}
        api={['thread']}
        app="video-player"
        description="See how you can add commenting into your video app using the Cord chat components"
      />
      <ClientSideRender>
        <VideoApp />
      </ClientSideRender>
    </>
  );
}
function VideoApp() {
  usePrepareMiniApp(
    `https://${APP_SERVER_HOST}/playground/video-player/index.css`,
    `https://${APP_SERVER_HOST}/playground/video-player/index.js`,
  );
  return <div></div>;
}
export default VideoPlayer;
