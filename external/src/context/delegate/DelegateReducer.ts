import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import type { DelegateAction } from 'external/src/context/delegate/DelegateAction.ts';
import { annotationHasLocation } from 'common/types/index.ts';
import {
  removeTextHighlight,
  showTextHighlight,
} from 'external/src/delegate/location/textHighlights.ts';

export const DelegateReducer = (
  state: DelegateState,
  action: DelegateAction,
): DelegateState => {
  switch (action.type) {
    case 'READY':
      return {
        ...state,
        ready: true,
      };

    case 'RESET':
      return {
        ...state,
        ready: false,
        annotationsVisible: {},
        annotationArrow: null,
      };

    case 'SET_THIRD_PARTY_OBJECTS': {
      return {
        ...state,
        thirdPartyObjects: action.thirdPartyObjects,
      };
    }

    case 'SHOW_ANNOTATION': {
      if (
        state.annotationsVisible[action.annotation.id] ||
        !annotationHasLocation(action.annotation)
      ) {
        return state;
      }

      const highlightedTextConfig =
        action.annotation.location?.highlightedTextConfig ??
        action.annotation.customHighlightedTextConfig;
      if (highlightedTextConfig) {
        showTextHighlight(
          action.annotation.id,
          highlightedTextConfig,
          action.annotation.location?.iframeSelectors ?? [],
        );
        return state;
      }

      return {
        ...state,
        annotationsVisible: {
          ...state.annotationsVisible,
          [action.annotation.id]: action.annotation,
        },
      };
    }

    case 'HIDE_ANNOTATION': {
      const { id, location, customHighlightedTextConfig } = action.annotation;
      if (location?.highlightedTextConfig || customHighlightedTextConfig) {
        removeTextHighlight(id);
        return state;
      } else {
        const { [id]: _, ...annotationsVisible } = state.annotationsVisible;
        return {
          ...state,
          annotationsVisible,
        };
      }
    }

    case 'SET_SCROLLING_TO_ANNOTATION': {
      return {
        ...state,
        scrollingToAnnotation: action.scrolling,
      };
    }

    case 'SHOW_ANNOTATION_ARROW': {
      if (!annotationHasLocation(action.arrow.annotation)) {
        return state;
      }
      // TODO - should we avoid this if we don't want to show arrow (vs. relying
      // on AnnotationArrow returning null)
      return {
        ...state,
        annotationArrow: action.arrow as DelegateState['annotationArrow'],
      };
    }

    case 'HIDE_ANNOTATION_ARROW': {
      if (
        !state.annotationArrow ||
        state.annotationArrow.annotation.id !== action.arrow.annotation.id
      ) {
        return state;
      }

      return {
        ...state,
        annotationArrow: null,
      };
    }

    case 'ANIMATE_OUT_ANNOTATION_ARROW': {
      if (
        !state.annotationArrow ||
        state.annotationArrow.annotation.id !== action.arrow.annotation.id
      ) {
        return state;
      }
      return {
        ...state,
        annotationArrow: {
          ...state.annotationArrow,
          animatingOut: true,
        },
      };
    }

    case 'SHOW_CONFIRM_MODAL':
      return {
        ...state,
        confirmModal: action.confirmModal,
      };

    case 'HIDE_CONFIRM_MODAL':
      return {
        ...state,
        confirmModal: null,
      };

    case 'SET_DEEPLINK_INFO':
      return {
        ...state,
        deepLinkInfo: action.deepLinkInfo,
      };
    case 'ANIMATE_ANNOTATION':
      return {
        ...state,
        animateAnnotationID: action.annotationID ?? null,
      };
  }
};
