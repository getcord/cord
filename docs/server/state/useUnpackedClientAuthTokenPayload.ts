import { useMemo } from 'react';
import { parseJWT } from 'common/auth/index.ts';

type UnpackedClientAuthTokenPayload = {
  userID: string | undefined;
  organizationID: string | undefined;
};

function useUnpackedClientAuthTokenPayload(
  clientAuthToken: string | null | undefined,
): UnpackedClientAuthTokenPayload {
  return useMemo(() => {
    const ret: UnpackedClientAuthTokenPayload = {
      userID: undefined,
      organizationID: undefined,
    };

    if (!clientAuthToken) {
      return ret;
    }

    let decodedPayload: object | undefined = undefined;
    try {
      decodedPayload = parseJWT(clientAuthToken).payload;
    } catch (e) {
      console.error('`clientAuthToken` payload did not contain valid JSON');
      console.error(e);
      return ret;
    }

    if (typeof decodedPayload !== 'object') {
      return ret;
    }

    if (
      !('organization_id' in decodedPayload) ||
      typeof decodedPayload['organization_id'] !== 'string'
    ) {
      return ret;
    }

    if (
      !('user_id' in decodedPayload) ||
      typeof decodedPayload['user_id'] !== 'string'
    ) {
      return ret;
    }

    ret.userID = decodedPayload.user_id;
    ret.organizationID = decodedPayload.organization_id;

    return ret;
  }, [clientAuthToken]);
}

export default useUnpackedClientAuthTokenPayload;
