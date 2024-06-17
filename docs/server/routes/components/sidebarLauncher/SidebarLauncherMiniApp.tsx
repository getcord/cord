/** @jsxImportSource @emotion/react */

import { Sidebar, SidebarLauncher } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';

function SidebarLauncherMiniApp() {
  return (
    <div css={{ height: '100%', width: '100%', padding: 32 }}>
      <SidebarLauncher label="View comments" />
      <Sidebar
        location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveSidebarLauncher }}
        showLauncher={false}
        open={false}
      />
    </div>
  );
}
export default SidebarLauncherMiniApp;
