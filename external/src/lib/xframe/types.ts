import type {
  Location,
  DocumentAnnotationResult,
  LocationMatch,
  MessageAnnotation,
  PageContext,
  Point2D,
  UUID,
} from 'common/types/index.ts';
import type { AnnotationOnPage } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import type { SidebarConfigContextValue } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';

type NoRequestData = never;
type NoResponse = void;

// Map MessageTypes to request data and response
// i.e. const { data: RESPONSE } = await sendXFrameMessage(message.type, REQUEST_DATA)
// Response options:
// 1) We don't need a response: void
// 2) We need to know when it completes, but don't need any data: Promise<void>
// 3) We need a data response back: Promise<RESPONSE>
type XFrameMessageTypes = {
  // Delegate --> Iframe
  PAGE_CONTEXT: {
    request: { context: PageContext | null };
    response: NoResponse;
  };
  THREAD_NAME: {
    request: { name: string };
    response: NoResponse;
  };
  PAGE_URL: {
    request: { url: string };
    response: NoResponse;
  };
  SET_VISIBLE: { request: boolean; response: NoResponse };
  SET_SIDEBAR_WIDTH: { request: number; response: NoResponse };
  GO_TO_MESSAGE: {
    request: { messageID: UUID; threadID: UUID; annotationID?: UUID };
    response: NoResponse;
  };
  SET_SIDEBAR_CONFIG: {
    request: SidebarConfigContextValue & { showPinsOnPage: boolean };
    response: NoResponse;
  };

  // Iframe --> Delegate
  READY: { request: NoRequestData; response: NoResponse };
  NAVIGATE: {
    request: { url: string };
    response: NoResponse;
  };
  CREATE_ANNOTATION: {
    request: {
      blurScreenshots?: boolean;
    };
    response: Promise<DocumentAnnotationResult | null>;
  };
  CANCEL_ANNOTATION: {
    request: NoRequestData;
    response: NoResponse;
  };
  SHOW_ANNOTATION: {
    request: {
      annotation: MessageAnnotation;
    };
    response: NoResponse;
  };
  HIDE_ANNOTATION: {
    request: {
      annotation: MessageAnnotation;
    };
    response: NoResponse;
  };
  GET_ANNOTATION_MATCH_TYPE: {
    request: { annotation: MessageAnnotation };
    response: Promise<LocationMatch>;
  };
  SCROLL_TO_ANNOTATION: {
    request: { annotation: MessageAnnotation };
    response: Promise<void>;
  };
  SKIP_MEDIA_TO_ANNOTATED_TIME: {
    request: { annotation: MessageAnnotation };
    response: Promise<void>;
  };
  DRAW_ARROW_TO_ANNOTATION: {
    request: {
      annotation: MessageAnnotation;
      fromPosition: Point2D;
    };
    response: NoResponse;
  };
  REMOVE_ANNOTATION_ARROW: {
    request: {
      annotation: MessageAnnotation;
      animate?: boolean;
    };
    response: NoResponse;
  };
  HIDE_SMALL_IMAGE_MODAL: { request: NoRequestData; response: NoResponse };
  OVERRIDE_CSS: {
    request: string;
    response: NoResponse;
  };
  SHOW_CONFIRM_MODAL: {
    request: {
      title: string;
      paragraphs: string[];
      confirmButtonText: string;
      cancelButtonText: string;
    };
    response: Promise<boolean>;
  };
  PRELOAD_IMAGE: {
    request: { imageUrl: string };
    response: NoResponse;
  };
  OPEN_CORD: { request: NoRequestData; response: NoResponse };

  SHOW_THIRD_PARTY_AUTH_MODAL: {
    request: {
      data?: {
        teamName?: string;
        title?: string;
        body?: string;
      };
    };

    response: NoResponse;
  };

  HIDE_THIRD_PARTY_AUTH_MODAL: { request: NoRequestData; response: NoResponse };

  CLOSE_SIDEBAR: { request: NoRequestData; response: NoResponse };

  CALL_NAVIGATE_OVERRIDE: {
    request: {
      url: string;
      location: Location | null;
      info: { orgID: string; threadID: string; groupID: string };
    };
    response: Promise<{ navigated: boolean }>;
  };

  GET_WINDOW_INNER_WIDTH: {
    request: NoRequestData;
    response: Promise<number>;
  };

  // Both ways
  UPDATE_ANNOTATIONS_ON_PAGE: {
    request: {
      allAnnotations: AnnotationOnPage[];
      hiddenAnnotationIDs: Set<UUID>;
    };
    response: NoResponse;
  };

  ANIMATE_ANNOTATION: {
    request: { annotationID: UUID | null };
    response: NoResponse;
  };

  // Response
  RESPONSE: {
    request: any;
    response: Promise<any>;
  };
};
export type XFrameMessageType = keyof XFrameMessageTypes;

export type XFrameMessageRequestData<X extends XFrameMessageType> =
  XFrameMessageTypes[X]['request'];

export type XFrameMessageResponse<X extends XFrameMessageType> =
  XFrameMessageTypes[X]['response'];

type XFrameMessageByType = {
  [T in XFrameMessageType]: {
    type: T;
    data: XFrameMessageRequestData<T>;
    id: UUID;
  };
};
export type XFrameMessage<X extends XFrameMessageType = XFrameMessageType> =
  XFrameMessageByType[X];

export type MessageListener<X extends XFrameMessageType> = (
  message: XFrameMessage<X>,
) => XFrameMessageResponse<X>;
