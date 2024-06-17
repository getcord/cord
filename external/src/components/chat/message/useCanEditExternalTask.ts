import { useCallback, useEffect } from 'react';

import type { UUID } from 'common/types/index.ts';
import { useCanEditExternalTaskQuery } from 'external/src/graphql/operations.ts';
import { useThirdPartyConnections } from 'external/src/effects/useThirdPartyConnections.ts';
import type { ThirdPartyConnectionType } from 'external/src/graphql/operations.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function useCanEditExternalTask(
  taskID: UUID,
  type: ThirdPartyConnectionType,
) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const thread = useThreadData();

  const orgIDToQuery = thread?.externalOrgID ?? organization?.externalID;

  const { data: canEditExternalTaskResponse, refetch: refreshCanEdit } =
    useCanEditExternalTaskQuery({
      variables: { taskID, externalType: type, _externalOrgID: orgIDToQuery },
    });

  const canEdit =
    canEditExternalTaskResponse?.task?.thirdPartyReference?.canEdit;

  const thirdPartyConnections = useThirdPartyConnections(type);
  const connected = thirdPartyConnections.connected(type);

  const reconnect = useCallback(async () => {
    await thirdPartyConnections.disconnect(type, false);
    thirdPartyConnections.startConnectFlow(type);
  }, [thirdPartyConnections, type]);

  useEffect(() => {
    if (connected) {
      void refreshCanEdit();
    }
  }, [connected, refreshCanEdit]);

  return { canEdit, reconnect };
}
