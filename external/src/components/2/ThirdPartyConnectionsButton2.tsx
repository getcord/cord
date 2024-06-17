import { useMemo } from 'react';

import { useThirdPartyConnections } from 'external/src/effects/useThirdPartyConnections.ts';
import type { ThirdPartyConnectionType } from 'external/src/graphql/operations.ts';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';

type Props = {
  connection: Exclude<ThirdPartyConnectionType, 'trello'>;
};

export function ThirdPartyConnectionsButton2({ connection }: Props) {
  const { connected, disconnect, startConnectFlow } =
    useThirdPartyConnections(connection);

  const connectionName = useMemo(() => {
    return capitalizeFirstLetter(connection) as IconType;
  }, [connection]);

  const renderProvider = useMemo(() => {
    return connected(connection) ? (
      <BasicButtonWithUnderline2
        labelColor="alert"
        onClick={() => disconnect(connection)}
        iconName={connectionName}
        label={`Disconnect ${connectionName}`}
        iconPosition="start"
        labelFontStyle="body"
      />
    ) : (
      <BasicButtonWithUnderline2
        labelColor="content-emphasis"
        onClick={() => startConnectFlow(connection)}
        iconName={connectionName}
        label={`Connect ${connectionName}`}
        iconPosition="start"
        labelFontStyle="body"
      />
    );
  }, [connected, connection, disconnect, startConnectFlow, connectionName]);

  return renderProvider;
}
