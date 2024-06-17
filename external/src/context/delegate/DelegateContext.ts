import type { Dispatch } from 'react';
import { createContext } from 'react';
import type { NavigateFn } from '@cord-sdk/types';
import type { DelegateAction } from 'external/src/context/delegate/DelegateAction.ts';
import type { MessageAnnotation, Point2D, UUID } from 'common/types/index.ts';
import type { ReactTrees } from 'external/src/delegate/annotations/ReactTrees.ts';
import type { MonacoEditors } from 'external/src/delegate/annotations/MonacoEditors.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type Nullable<T> = T | null;

export type ThirdPartyObjects = {
  monacoEditors: MonacoEditors;
  reactTrees: ReactTrees;
};

export const DelegateContext = createContext<
  | typeof NO_PROVIDER_DEFINED
  | {
      state: DelegateState;
      dispatch: Dispatch<DelegateAction>;
    }
>(NO_PROVIDER_DEFINED);

export type DelegateState = {
  ready: boolean;
  scrollingToAnnotation: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  annotationArrow: Nullable<{
    annotation: MessageAnnotation;
    fromPosition: Point2D;
    animatingOut?: true;
  }>;
  annotationsVisible: {
    [id in UUID]: MessageAnnotation;
  };
  confirmModal: Nullable<{
    title: string;
    paragraphs: string[];
    onConfirm: () => void;
    onReject: () => void;
    confirmButtonText: string;
    cancelButtonText: string;
  }>;
  thirdPartyObjects: ThirdPartyObjects;
  navigate: NavigateFn | null;
  deepLinkInfo: {
    threadID: UUID;
    messageID: UUID;
    annotationID?: UUID;
  } | null;
  animateAnnotationID: UUID | null;
};
