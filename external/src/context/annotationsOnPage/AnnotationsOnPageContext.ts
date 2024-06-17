import { createContext } from 'react';

import type { MessageAnnotation, UUID } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type AnnotationOnPage = MessageAnnotation & {
  messageID: UUID;
  threadID: UUID;
  // When a message is sent, an annotation is optimistically added to the
  // AnnotationsOnPageProvider.  If it's the first message in a new thread, the
  // threadID passed in is the one that's just been generated in the front end,
  // but that thread hasn't actually been created in the db yet (it will be,
  // momentarily afterwards).  To stop the Annotation Pointer trying to query for
  // a thread which doesn't yet exist, we also pass and consider this flag.
  isDraftThread?: boolean;
};

export type AnnotationsOnPageContextType = {
  addAnnotationToPage: (annotation: AnnotationOnPage) => void;
  removeAnnotationFromPage: (
    annotationID: UUID,
  ) => AnnotationOnPage | undefined;
  animateAnnotation: (annotationID: UUID | null) => void;
  annotationSetID: UUID;
};

export const AnnotationsOnPageContext = createContext<
  AnnotationsOnPageContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
