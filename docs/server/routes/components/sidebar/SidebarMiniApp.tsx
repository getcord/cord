/** @jsxImportSource @emotion/react */

import { Sidebar } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';

function SidebarMiniApp() {
  return (
    <div css={{ height: '100%', width: '100%' }}>
      <Sidebar location={{ page: DOCS_LIVE_PAGE_LOCATIONS.liveSidebar }} />
    </div>
  );
}
export default SidebarMiniApp;
