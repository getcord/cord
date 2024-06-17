import { createContext } from 'react';

import type { UserFragment } from 'external/src/graphql/operations.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export interface PageVisitorWithDate {
  user: UserFragment;
  lastSeen: Date;
}

type PageVisitorsProps = {
  visitors: PageVisitorWithDate[];
};

export const PageVisitorsContext = createContext<
  PageVisitorsProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
