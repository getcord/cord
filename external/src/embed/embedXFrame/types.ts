import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import type {
  DocumentLocation,
  HighlightedTextConfig,
  IframeMouseMoveData,
  JsonObject,
  LocationMatch,
  UUID,
} from 'common/types/index.ts';
import type {
  AnnotationArrowPosition,
  AnnotationPosition,
} from 'external/src/delegate/annotations/types.ts';

type NoRequestData = never;
type NoResponseData = Promise<void>;

// Map MessageTypes to request data and response
// i.e. const { data: RESPONSE } = await sendEmbedXFrameMessage(message.type, REQUEST_DATA)
type EmbedXFrameMessageTypes = {
  // Host webpage to cross-domain iframe
  CORD_PING: {
    request: NoRequestData;
    response: NoResponseData;
  };
  CORD_SCREENSHOT: {
    request: { width: number; height: number };
    response: Promise<{ screenshotUrl: string | null }>;
  };
  CORD_HIGHLIGHT_TEXT_ON_SCREENSHOT: {
    request: { highlightedTextConfig: HighlightedTextConfig };
    response: Promise<{ screenshotUrl: string | null }>;
  };
  CORD_SET_INITIAL_SELECTION: {
    request: { position: { x: number; y: number } };
    response: NoResponseData;
  };
  CORD_EXTEND_SELECTION: {
    request: { position: { x: number; y: number } };
    response: Promise<{ selectionChanged: boolean }>;
  };
  CORD_IS_TEXT_SELECTED: {
    request: NoRequestData;
    response: Promise<boolean>;
  };
  CORD_GET_DOCUMENT_LOCATION: {
    request: {
      iframeSelectors: string[];
      position: { x: number; y: number };
      hashAnnotations: boolean;
    };
    response: Promise<DocumentLocation | null>;
  };
  CORD_GET_ANNOTATION_POSITION: {
    request: {
      documentLocation: DocumentLocation;
    };
    response: Promise<AnnotationPosition | null>;
  };
  CORD_GET_ANNOTATION_MATCH_TYPE: {
    request: {
      documentLocation: DocumentLocation;
    };
    response: Promise<LocationMatch>;
  };
  CORD_GET_ANNOTATION_ARROW_POSITION: {
    request: {
      documentLocation: DocumentLocation;
    };
    response: Promise<AnnotationArrowPosition | null>;
  };
  CORD_SHOW_TEXT_HIGHLIGHT: {
    request: {
      annotationID: UUID;
      highlightedTextConfig: HighlightedTextConfig;
      iframeSelectors: string[];
    };
    response: NoResponseData;
  };
  CORD_HIDE_TEXT_HIGHLIGHT: {
    request: { annotationID: UUID };
    response: NoResponseData;
  };
  CORD_SCROLL_TO_ANNOTATION: {
    request: {
      documentLocation: DocumentLocation;
    };
    response: NoResponseData;
  };

  // Cross-domain iframe to host webpage
  CORD_REGISTER: {
    request: NoRequestData;
    response: NoResponseData;
  };
  CORD_SCROLL: {
    request: NoRequestData;
    response: NoResponseData;
  };
  CORD_LOG: {
    request: {
      logFn: keyof BasicLogger;
      args: [string, JsonObject?];
    };
    response: NoResponseData;
  };
  CORD_MESSAGE_HANDLED: {
    request: NoRequestData;
    response: Promise<boolean>;
  };
  CORD_MOUSEDOWN: {
    request: NoRequestData;
    response: NoResponseData;
  };
  CORD_MOUSEMOVE: {
    request: IframeMouseMoveData | null;
    response: Promise<IframeMouseMoveData | null>;
  };
  // Response
  CORD_RESPONSE: {
    request: any;
    response: Promise<any>;
  };
};
export type EmbedXFrameMessageType = keyof EmbedXFrameMessageTypes;

export type EmbedXFrameMessageRequestData<X extends EmbedXFrameMessageType> =
  EmbedXFrameMessageTypes[X]['request'];

export type EmbedXFrameMessageResponse<X extends EmbedXFrameMessageType> =
  EmbedXFrameMessageTypes[X]['response'];

type EmbedXFrameMessageByType = {
  [T in EmbedXFrameMessageType]: {
    type: T;
    data: EmbedXFrameMessageRequestData<T>;
    id: UUID;
  };
};
export type EmbedXFrameMessage<
  X extends EmbedXFrameMessageType = EmbedXFrameMessageType,
> = EmbedXFrameMessageByType[X];

export type EmbedMessageListener<X extends EmbedXFrameMessageType> = (
  message: EmbedXFrameMessage<X>,
  source: MessageEventSource,
) => EmbedXFrameMessageResponse<X>;
