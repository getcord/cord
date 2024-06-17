import { memo } from 'react';

import type { PagePresenceReactComponentProps } from '@cord-sdk/react';
import { withGroupIDCheck } from '@cord-sdk/react/common/hoc/withGroupIDCheck.tsx';

import { PresenceFacepileImpl } from 'sdk/client/core/react/PresenceFacepile.tsx';
import PresenceObserver from 'sdk/client/core/react/PresenceObserver.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { PagePresenceCSSOverrides } from 'sdk/client/core/css/overrides.ts';

const PagePresence = withGroupIDCheck<PagePresenceReactComponentProps>(
  PagePresenceImpl,
  'PagePresence',
);

function PagePresenceImpl({
  context,
  location,
  maxUsers,
  excludeViewer,
  orientation = 'horizontal',
  onlyPresentUsers,
  durable = true,
  groupId: groupIDInput,
}: PagePresenceReactComponentProps) {
  return (
    <CSSVariableOverrideContext.Provider value={PagePresenceCSSOverrides}>
      <PresenceFacepileImpl
        location={location ?? context}
        excludeViewer={excludeViewer}
        onlyPresentUsers={onlyPresentUsers}
        orientation={orientation}
        maxUsers={maxUsers}
      />
      <PresenceObserver
        location={location ?? context}
        durable={durable}
        observeDocument={true}
        groupId={groupIDInput}
      />
    </CSSVariableOverrideContext.Provider>
  );
}

// TODO: make this automatic
export default memo(PagePresence);
