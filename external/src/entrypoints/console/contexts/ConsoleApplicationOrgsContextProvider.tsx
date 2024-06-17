import {
  createContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import type { ElementOf, UUID } from 'common/types/index.ts';
import type { GetOrgsQueryResult } from 'external/src/entrypoints/console/graphql/operations.ts';
import { useGetOrgsQuery } from 'external/src/entrypoints/console/graphql/operations.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ConsoleOrgDataResult = GetOrgsQueryResult['getOrgs'];

type ConsoleOrgData = ElementOf<NonNullable<ConsoleOrgDataResult>>;

type ConsoleApplicationOrgsContextProps = {
  id: UUID | null;
  organizations: ConsoleOrgDataResult;
  refetchOrganizations: () => Promise<unknown>;
  getOrgByID: (orgID: string) => ConsoleOrgData | null;
};

export const ConsoleApplicationOrgsContext = createContext<
  ConsoleApplicationOrgsContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ConsoleApplicationOrgsContextProvider(
  props: React.PropsWithChildren<unknown>,
) {
  const { id } = useUnsafeParams<{ id: UUID }>();

  const { data, refetch } = useGetOrgsQuery({
    variables: { applicationID: id },
  });

  const [organizations, setOrganizations] = useState<ConsoleOrgDataResult>([]);

  useEffect(() => {
    if (data?.getOrgs) {
      setOrganizations(data.getOrgs);
    }
  }, [data]);

  const orgMap: Map<string, ConsoleOrgData> = useMemo(() => {
    return new Map<string, ConsoleOrgData>(
      organizations?.map((org) => [org.id, org]) ?? [],
    );
  }, [organizations]);

  const getOrgByID = useCallback(
    (orgID: string) => orgMap.get(orgID) ?? null,
    [orgMap],
  );

  const contextValue = useMemo(
    () => ({
      id,
      organizations,
      refetchOrganizations: refetch,
      getOrgByID,
    }),
    [getOrgByID, id, organizations, refetch],
  );

  return (
    <ConsoleApplicationOrgsContext.Provider value={contextValue}>
      {props.children}
    </ConsoleApplicationOrgsContext.Provider>
  );
}
