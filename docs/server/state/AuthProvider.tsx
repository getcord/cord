/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { useMemo } from 'react';
import useUnpackedClientAuthTokenPayload from 'docs/server/state/useUnpackedClientAuthTokenPayload.ts';

type AuthContextType = {
  userID: string | undefined;
  organizationID: string | undefined;
  clientAuthToken: string | undefined;
};

export const AuthContext = React.createContext<AuthContextType>({
  userID: undefined,
  organizationID: undefined,
  clientAuthToken: undefined,
});

type AuthProviderProps = {
  clientAuthToken: string | undefined;
  children: React.ReactNode;
};
function AuthProvider({ clientAuthToken, children }: AuthProviderProps) {
  const unpacked = useUnpackedClientAuthTokenPayload(clientAuthToken);
  const value = useMemo(() => {
    return {
      clientAuthToken,
      userID: unpacked.userID,
      organizationID: unpacked.organizationID,
    };
  }, [clientAuthToken, unpacked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
