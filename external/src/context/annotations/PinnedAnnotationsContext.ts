import { createContext } from 'react';

import type { UUID } from 'common/types/index.ts';
import type { AnnotationOnPage } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type PinnedAnnotationContextType = {
  addAnnotationSet: (
    annotationSetID: UUID,
    annotations: AnnotationOnPage[],
  ) => void;
  removeAnnotationSet: (annotationSetID: UUID) => void;
  isAnnotationOnPage: (annotationSetID: UUID, annotationID: UUID) => boolean;
  getAnnotationPinsToRender: (
    annotationSetID: UUID | undefined,
  ) => AnnotationOnPage[];
  setAnnotationPinSize: (annotationPinSize: string) => void;
  annotationPinSize: number;
};

export const PinnedAnnotationsContext = createContext<
  PinnedAnnotationContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
