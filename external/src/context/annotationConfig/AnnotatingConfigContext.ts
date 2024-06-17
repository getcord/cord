import { createContext } from 'react';
import type { DocumentAnnotationResult } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type AnnotatingConfig = {
  onSuccess: (result: DocumentAnnotationResult) => void;
  onCancel: () => void;
  blurScreenshots: boolean;
};

type AnnotatingConfigContextType = {
  annotatingConfig: AnnotatingConfig | null;
  startAnnotating: (annotatingConfig: AnnotatingConfig | null) => void;
  completeAnnotating: () => void;
  cancelAnnotating: () => void;
};

export const AnnotatingConfigContext = createContext<
  AnnotatingConfigContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
