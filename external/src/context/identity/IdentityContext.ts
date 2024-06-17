import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';

type IdentityContextProps = {
  user: UserFragment;
  email: string | null;
  isSlackConnected: boolean;
  organizations: { externalID: string }[];
};

export const IdentityContext = createContext<
  IdentityContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
