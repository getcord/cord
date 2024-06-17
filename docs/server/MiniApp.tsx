/** @jsxImportSource @emotion/react */

import { Routes, Route } from 'react-router-dom';

import { useEffect } from 'react';
import DocsCordProvider from 'docs/server/state/DocsCordProvider.tsx';
import SidebarMiniApp from 'docs/server/routes/components/sidebar/SidebarMiniApp.tsx';
import SidebarLauncherMiniApp from 'docs/server/routes/components/sidebarLauncher/SidebarLauncherMiniApp.tsx';
import Document from 'docs/server/routes/getStarted/demoApps/document/Document.tsx';
import Dashboard from 'docs/server/routes/getStarted/demoApps/dashboard/Dashboard.tsx';
import VideoPlayer from 'docs/server/routes/getStarted/demoApps/videoPlayer/VideoPlayer.tsx';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import CanvasNew from 'docs/server/routes/getStarted/demoApps/canvas/CanvasNew.tsx';

function MiniApp() {
  return (
    <DocsCordProvider>
      <Routes>
        <Route
          path="/components/cord-sidebar-mini-app"
          element={<SidebarMiniApp />}
        />
        <Route
          path="/components/cord-sidebar-launcher-mini-app"
          element={<SidebarLauncherMiniApp />}
        />
        <Route path="/get-started/demo-apps/document" element={<Document />} />
        <Route
          path="/get-started/demo-apps/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/get-started/demo-apps/canvas-new"
          element={<CanvasNew />}
        />
        <Route
          path="/get-started/demo-apps/video-player"
          element={<VideoPlayer />}
        />
      </Routes>
    </DocsCordProvider>
  );
}

export function usePrepareMiniApp(styleHref: string, scriptSrc: string) {
  useEffect(() => {
    if (!document.head.querySelector(`base[href="${APP_ORIGIN}"]`)) {
      const base = document.createElement('base');
      base.href = APP_ORIGIN;
      document.head.appendChild(base);
    }

    if (!document.head.querySelector(`link[href="${styleHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleHref;
      document.head.appendChild(link);
    }

    if (!document.getElementById('root')) {
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }

    if (!document.body.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'module';
      document.body.appendChild(script);
    }
  }, [scriptSrc, styleHref]);
}

export default MiniApp;
