import { useMatch } from 'react-router-dom';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { Sizes } from 'common/const/Sizes.ts';

import { Sidebar } from '@cord-sdk/react';

export function AdminSidebar() {
  const issueMatch = useMatch(AdminRoutes.ISSUE);

  if (issueMatch) {
    return <></>;
  }

  return (
    <Sidebar
      showPresence={false}
      showCloseButton={true}
      showLauncher={false}
      open={false}
      onOpen={() => {
        // TODO: this hardcoded width is crap
        document.body.style.marginRight = `${Sizes.SIDEBAR_COMPACT_WIDTH}px`;
      }}
      onClose={() => {
        document.body.style.marginRight = '0';
      }}
    />
  );
}
