import { createContext } from 'react';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import type { ThreadMode, UUID } from 'common/types/index.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type Thread2ContextType = {
  threadID: UUID;
  externalThreadID: string | null;
  threadMode: ThreadMode;
  initialSlackShareChannel: SlackChannelType | null;
  thread: ThreadData | null;
};

export const Thread2Context = createContext<
  Thread2ContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
