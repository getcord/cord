import { createContext } from 'react';

import type { UUID } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type ThreadDeepLinkInfo = {
  threadID: UUID;
  messageID: UUID | null;
  annotationID?: UUID;
};

type DeepLinkContextType = {
  addDeepLinkInfo: (info: ThreadDeepLinkInfo) => void;
  clearDeepLinkInfo: () => void;
  deepLinkInfo: ThreadDeepLinkInfo | null;
  shouldShowDeepLinkHighlight: (
    threadID: UUID,
    ...messages: Array<{ id: UUID }>
  ) => boolean;
  setDeepLinkedMessageElement: (div: HTMLDivElement | null) => void;
  deepLinkedMessageRef: React.MutableRefObject<HTMLDivElement | null>;
  setDeepLinkInProcess: (deepLinkInProcess: boolean) => void;
  onNavigateToDeepLink: () => void;
};

export const DeepLinkContext = createContext<
  DeepLinkContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
