import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';

export const PagePresenceContext = createContext<
  Array<UserFragment> | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
