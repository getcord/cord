import { v4 as uuid } from 'uuid';
import type { UUID } from 'common/types/index.ts';
import type {
  EmbedXFrameMessage,
  EmbedXFrameMessageRequestData,
  EmbedXFrameMessageResponse,
  EmbedXFrameMessageType,
  EmbedMessageListener,
} from 'external/src/embed/embedXFrame/types.ts';

export type { EmbedXFrameMessage };

// How long to allow for the cross-domain iframe to respond that it's handling the message
const MESSAGE_HANDLE_MAX_WAIT_TIME_MS = 250;

const listeners: {
  [X in EmbedXFrameMessageType]: Array<
    EmbedMessageListener<EmbedXFrameMessageType>
  >;
} = {
  CORD_PING: [],
  CORD_SCREENSHOT: [],
  CORD_HIGHLIGHT_TEXT_ON_SCREENSHOT: [],
  CORD_LOG: [],
  CORD_SET_INITIAL_SELECTION: [],
  CORD_EXTEND_SELECTION: [],
  CORD_IS_TEXT_SELECTED: [],
  CORD_GET_DOCUMENT_LOCATION: [],
  CORD_GET_ANNOTATION_POSITION: [],
  CORD_GET_ANNOTATION_MATCH_TYPE: [],
  CORD_GET_ANNOTATION_ARROW_POSITION: [],
  CORD_SHOW_TEXT_HIGHLIGHT: [],
  CORD_HIDE_TEXT_HIGHLIGHT: [],
  CORD_SCROLL_TO_ANNOTATION: [],
  CORD_SCROLL: [],
  CORD_REGISTER: [],
  CORD_MOUSEDOWN: [],
  CORD_MOUSEMOVE: [],

  CORD_MESSAGE_HANDLED: [],
  CORD_RESPONSE: [handleEmbedXFrameResponse],
};

function isEmbedXFrameMessage(messageType: string) {
  return messageType in listeners;
}

type EmbedXFrameMessageResolver = (value: any) => void;
const resolvers: { [key: string]: EmbedXFrameMessageResolver } = {};
const messagesHandled = new Set<UUID>();

let inIframe = false;
try {
  inIframe = window !== window.top;
} catch {
  // Window not available, likely in test environment
}

// Weird Typescript syntax (rest parameter) is to conditionally require the data argument
// https://stackoverflow.com/a/52318137
export function sendEmbedXFrameMessage<X extends EmbedXFrameMessageType>(
  targetWindow: Window | null,
  type: X,
  ...data: EmbedXFrameMessageRequestData<X> extends never
    ? []
    : [EmbedXFrameMessageRequestData<X>]
): EmbedXFrameMessageResponse<X> {
  if (!targetWindow) {
    throw new Error('No target window');
  }

  const id = uuid();
  return new Promise((resolve, reject) => {
    if (!inIframe) {
      setTimeout(() => {
        if (!messagesHandled.has(id)) {
          delete resolvers[id];
          reject();
        }
      }, MESSAGE_HANDLE_MAX_WAIT_TIME_MS);
    }
    resolvers[id] = resolve;
    const message = {
      id,
      type,
      data: data?.[0],
    };

    try {
      targetWindow.postMessage(message, '*');
    } catch (error) {
      if (error instanceof Error) {
        reject(error.message);
      }
    }
  });
}

function sendEmbedXFrameResponse(targetWindow: Window, id: UUID, data?: any) {
  const message: EmbedXFrameMessage<'CORD_RESPONSE'> = {
    id,
    type: 'CORD_RESPONSE',
    data,
  };
  targetWindow.postMessage(message, '*');
}

async function handleEmbedXFrameResponse(
  message: EmbedXFrameMessage<EmbedXFrameMessageType>,
) {
  if (resolvers[message.id]) {
    const resolve = resolvers[message.id];
    delete resolvers[message.id];
    resolve(message.data);
  }
}

export function addEmbedXFrameMessageListener<X extends EmbedXFrameMessageType>(
  type: X,
  callback: EmbedMessageListener<X>,
) {
  if (listenersCount() === 0) {
    window.addEventListener('message', onMessage);
  }
  listeners[type].push(callback as any);
  return () => removeEmbedXFrameMessageListener(type, callback);
}

export function removeEmbedXFrameMessageListener<
  X extends EmbedXFrameMessageType,
>(type: X, callback: EmbedMessageListener<X>) {
  listeners[type] = listeners[type].filter((cb: any) => cb !== callback);
  if (listenersCount() === 0) {
    window.removeEventListener('message', onMessage);
  }
}

const onMessage = (event: MessageEvent) => {
  const source = event.source;
  if (!source) {
    return;
  }

  // Confirm that message was handled. If we don't receive confirmation after
  // MESSAGE_HANDLE_MAX_WAIT_TIME_MS, it probably means we don't have our handling
  // set up in the iframe, so we reject
  if (
    inIframe &&
    isEmbedXFrameMessage(event.data.type) &&
    event.data.type !== 'CORD_RESPONSE' &&
    event.data.type !== 'CORD_MESSAGE_HANDLED'
  ) {
    (source as Window).postMessage(
      {
        id: event.data.id,
        type: 'CORD_MESSAGE_HANDLED',
      },
      '*',
    );
  }

  if (!inIframe && event.data.type === 'CORD_MESSAGE_HANDLED') {
    messagesHandled.add(event.data.id);
  }

  // This is a super simple API. We receive a message with a `type` from
  // the source window and handle it based on that `type`.
  const message = event.data as EmbedXFrameMessage<EmbedXFrameMessageType>;

  if (Object.keys(listeners).includes(message.type)) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    listeners[message.type].forEach(async (cb) => {
      const response = await cb(message, source);
      if (message.type !== 'CORD_RESPONSE') {
        sendEmbedXFrameResponse(source as Window, message.id, response);
      }
    });
  }
};

const listenersCount = () =>
  Object.values(listeners).reduce(
    (total, callbacks) => total + callbacks.length,
    0,
  ) - 1; // -1 because [EmbedXFrameMessageType.RESPONSE]: [handleEmbedXFrameResponse] is always there
