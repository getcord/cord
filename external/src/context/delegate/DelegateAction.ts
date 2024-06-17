import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import type { MessageAnnotation, Point2D, UUID } from 'common/types/index.ts';

export type DelegateAction =
  | { type: 'READY' }
  | { type: 'RESET' }
  | {
      type: 'SHOW_ANNOTATION';
      annotation: MessageAnnotation;
    }
  | {
      type: 'HIDE_ANNOTATION';
      annotation: MessageAnnotation;
    }
  | { type: 'SET_SCROLLING_TO_ANNOTATION'; scrolling: boolean }
  | {
      type: 'SHOW_ANNOTATION_ARROW';
      arrow: {
        annotation: MessageAnnotation;
        fromPosition: Point2D;
      };
    }
  | {
      type: 'ANIMATE_OUT_ANNOTATION_ARROW';
      arrow: {
        annotation: MessageAnnotation;
      };
    }
  | {
      type: 'HIDE_ANNOTATION_ARROW';
      arrow: {
        annotation: MessageAnnotation;
      };
    }
  | {
      type: 'SHOW_CONFIRM_MODAL';
      confirmModal: DelegateState['confirmModal'];
    }
  | {
      type: 'HIDE_CONFIRM_MODAL';
    }
  | {
      type: 'SET_THIRD_PARTY_OBJECTS';
      thirdPartyObjects: DelegateState['thirdPartyObjects'];
    }
  | {
      type: 'SET_DEEPLINK_INFO';
      deepLinkInfo: {
        threadID: UUID;
        messageID: UUID;
        annotationID?: UUID;
      } | null;
    }
  | {
      type: 'ANIMATE_ANNOTATION';
      annotationID: UUID | null;
    };
