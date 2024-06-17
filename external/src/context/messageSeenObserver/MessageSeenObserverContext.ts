import { createContext } from 'react';
import type { UUID } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type MessageSeenObserverContextType = {
  observeMessage: (
    messageID: UUID,
    threadID: UUID,
    messageElementRef: React.RefObject<HTMLElement>,
    onSeenLocalUpdate: () => void,
  ) => void;
  unobserveMessage: (messageID: UUID) => void;
};

export const MessageSeenObserverContext = createContext<
  MessageSeenObserverContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
