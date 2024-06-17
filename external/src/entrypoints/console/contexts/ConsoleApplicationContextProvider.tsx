import { createContext, useEffect, useMemo, useState } from 'react';
import * as jose from 'jose';
import type { UUID } from 'common/types/index.ts';
import type { ConsoleApplicationFragment } from 'external/src/entrypoints/console/graphql/operations.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import {
  useApplicationEventsSubscription,
  useApplicationForConsoleQuery,
} from 'external/src/entrypoints/console/graphql/operations.ts';

async function getServerJWTToken(
  application: ConsoleApplicationFragment | null,
) {
  if (!application) {
    return null;
  }
  const secret = new TextEncoder().encode(application.sharedSecret);
  const alg = 'HS512';

  const jwt = await new jose.SignJWT({ app_id: application.id })
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);

  return jwt;
}

type ConsoleApplicationContextProps = {
  id: UUID | null;
  application: ConsoleApplicationFragment | null;
  jwt: string | null;
  refetch: () => Promise<unknown>;
  setApplicationID: (appID: string) => void;
};

export const ConsoleApplicationContext = createContext<
  ConsoleApplicationContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ConsoleApplicationContextProvider(
  props: React.PropsWithChildren<unknown>,
) {
  const [appID, setAppID] = useState<string | null>(null);
  const [application, setApplication] =
    useState<ConsoleApplicationFragment | null>(null);
  const [jwt, setJWT] = useState<string | null>(null);

  const { data, refetch } = useApplicationForConsoleQuery({
    variables: { id: appID! },
    skip: !appID,
  });

  // only really need to call this if we have an application
  useApplicationEventsSubscription({
    skip: !appID,
    variables: { applicationID: appID! },
    onData: ({ data: { data: eventData } }) => {
      if (
        eventData?.applicationEvents.__typename ===
        'ConsoleGettingStartedUpdated'
      ) {
        void refetch();
      }
    },
  });

  useEffect(() => {
    const generateToken = async (app: ConsoleApplicationFragment) => {
      try {
        const token = await getServerJWTToken(app);
        setJWT(token);
      } catch (_) {}
    };

    if (data?.application) {
      setApplication(data?.application);
      setJWT(null);
      if (data?.application) {
        void generateToken(data.application);
      }
    }
  }, [data]);

  const contextValue = useMemo(
    () => ({
      id: appID,
      refetch,
      application,
      setApplicationID: setAppID,
      jwt,
    }),
    [appID, refetch, application, jwt],
  );

  return (
    <ConsoleApplicationContext.Provider value={contextValue}>
      {props.children}
    </ConsoleApplicationContext.Provider>
  );
}
