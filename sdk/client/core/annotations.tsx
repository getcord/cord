import { useCallback, useMemo, useRef } from 'react';
import * as base64 from 'js-base64';
import type {
  Annotation,
  AnnotationHandler,
  AnnotationCapturePosition,
  Location,
  ICordAnnotationSDK,
  AnnotationRenderPosition,
  AnnotationWithThreadID,
} from '@cord-sdk/types';
import {
  CORD_SCREENSHOT_TARGET_DATA_ATTRIBUTE,
  locationJson,
  CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
} from '@cord-sdk/types';
import type { Point2D } from 'common/types/index.ts';
import {
  locationEqual,
  locationMatches,
  isLocation,
  LocationMatch,
} from 'common/types/index.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME } from 'common/const/Strings.ts';
import { isDefined } from 'common/util/index.ts';
import {
  logApiCall,
  logDeprecatedCall,
} from 'sdk/client/core/cordAPILogger.ts';
import { getDocumentLocation } from 'external/src/delegate/location/index.ts';
import { Annotation as AnnotationDecoder } from 'external/src/delegate/annotations/Annotation.ts';

type DocumentPosition = {
  documentLeft: number;
  documentTop: number;
  width: number;
  height: number;
};

type AnnotationHandlers = {
  getAnnotationPosition: Map<
    string,
    AnnotationHandler['getAnnotationPosition']
  >;
  onAnnotationCapture: Map<string, AnnotationHandler['onAnnotationCapture']>;
  onAnnotationClick: Map<string, AnnotationHandler['onAnnotationClick']>;
};

/** @deprecated TODO(am) delete this fn when SundaySky migrates away from API */
export function getClosestScreenshotTarget(target: Element | null | undefined) {
  return target?.closest(`[${CORD_SCREENSHOT_TARGET_DATA_ATTRIBUTE}]`) ?? null;
}

export function getClosestCustomAnnotationTarget(
  target: Element | null | undefined,
) {
  return (
    target?.closest(`[${CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE}]`) ?? null
  );
}

export function isElementWithinCustomAnnotationTarget(
  element: Element | undefined | null,
) {
  if (!element) {
    return false;
  }

  return !!element.closest(`[${CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE}]`);
}

const CENTER = { x: '50%', y: '50%' };

function findHandlerMatchingLocation<T extends keyof AnnotationHandlers>(
  handlers: AnnotationHandlers,
  type: T,
  location: Location,
): { handler: null } | { handler: AnnotationHandler[T]; exact: boolean } {
  // find the handler that matches the location in the most specific way
  let mostSpecificMatchedKeyCount = 0;
  let mostSpecificHandler: AnnotationHandler[T] | undefined;
  let mostSpecificMatchExact = false;

  for (const [locationString, handler] of handlers[type].entries()) {
    const handlerLocation = JSON.parse(locationString);
    const handlerLocationKeyCount = Object.keys(handlerLocation).length;
    if (handlerLocationKeyCount <= mostSpecificMatchedKeyCount) {
      // not worth checking for a match because we already found an equal or more specific match
      continue;
    }

    // check if handlerLocation is a subset of location.
    // for example, a handler registered on { section: "table" } would match an event
    // triggered on { section: "table", row: 3 }
    if (locationMatches(location, handlerLocation)) {
      mostSpecificMatchedKeyCount = handlerLocationKeyCount;
      mostSpecificHandler = handler as AnnotationHandler[T];
      mostSpecificMatchExact = locationEqual(location, handlerLocation);
    }
  }

  if (!mostSpecificHandler) {
    return { handler: null };
  }

  return {
    handler: mostSpecificHandler,
    exact: mostSpecificMatchExact,
  };
}

function findElementMatchingLocation(
  location: Location,
): { element: null } | { element: HTMLElement; exact: boolean } {
  // TODO: maybe replace with `*[${CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE}="${escape(locationString)}"]`
  const elements = [
    ...document.querySelectorAll(
      `*[${CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE}]`,
    ),
  ]
    .map((element) => {
      const attribute = element.getAttribute(
        CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
      );
      if (!attribute) {
        return null;
      }

      try {
        const elementLocation = JSON.parse(attribute);
        if (!isLocation(elementLocation)) {
          return null;
        }

        if (!locationMatches(location, elementLocation)) {
          return null;
        }

        return {
          element: element as HTMLElement,
          location: elementLocation,
        };
      } catch {
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (elements.length === 0) {
    return { element: null };
  }

  // find the element that matches the location in the most specific way
  let mostSpecificMatchedKeyCount = 0;
  let mostSpecificMatch: HTMLElement | undefined;
  let mostSpecificMatchExact = false;

  for (const { element, location: elementLocation } of elements) {
    const elementLocationKeyCount = Object.keys(elementLocation).length;
    if (elementLocationKeyCount > mostSpecificMatchedKeyCount) {
      mostSpecificMatchedKeyCount = elementLocationKeyCount;
      mostSpecificMatch = element;
      mostSpecificMatchExact = locationEqual(elementLocation, location);
    }
  }

  if (!mostSpecificMatch) {
    return { element: null };
  }

  return {
    element: mostSpecificMatch,
    exact: mostSpecificMatchExact,
  };
}

function getDocumentPositionFromRect(
  rect: DOMRect | undefined,
): DocumentPosition | undefined {
  if (!rect) {
    return undefined;
  }

  return {
    documentLeft: rect.left + window.scrollX,
    documentTop: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

function getPixelValue(value: string | number, percentOfSize: number) {
  if (typeof value === 'number') {
    return value;
  }

  const floatValue = parseFloat(value);
  if (value.endsWith('%')) {
    return (floatValue / 100) * percentOfSize;
  }

  return floatValue;
}

function getDocumentCoordinates(
  position: { x: string | number; y: string | number },
  relativeToDocumentPosition: DocumentPosition | undefined,
) {
  if (!relativeToDocumentPosition) {
    return {
      x: getPixelValue(position.x, window.innerWidth),
      y: getPixelValue(position.y, window.innerHeight),
    };
  }

  return {
    x:
      relativeToDocumentPosition.documentLeft +
      getPixelValue(position.x, relativeToDocumentPosition.width),
    y:
      relativeToDocumentPosition.documentTop +
      getPixelValue(position.y, relativeToDocumentPosition.height),
  };
}

export class AnnotationSDK implements ICordAnnotationSDK {
  // TODO: if i type this as AnnotationHandlers i get a type error. what's that about?
  annotationHandlers = {
    getAnnotationPosition: new Map(),
    onAnnotationCapture: new Map(),
    onAnnotationClick: new Map(),
  };

  /**
   * @deprecated Use functions specific to the type of handler you are setting.
   */
  setAnnotationHandler<T extends keyof AnnotationHandler>(
    type: T,
    locationString: string,
    handler: AnnotationHandler[T] | null,
  ): void {
    logDeprecatedCall('annotation.setAnnotationHandler');
    if (handler) {
      this.annotationHandlers[type].set(locationString, handler);
    } else {
      this.annotationHandlers[type].delete(locationString);
    }
  }

  setRenderHandler<L extends Location>(
    location: L,
    handler: AnnotationHandler<L>['getAnnotationPosition'],
  ): void {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    if (!isDefined(handler)) {
      throw new Error('Invalid handler');
    }

    logApiCall('annotation', 'setRenderHandler');

    this.annotationHandlers['getAnnotationPosition'].set(
      locationJson(location),
      handler,
    );
  }

  clearRenderHandler(location: Location) {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    this.annotationHandlers['getAnnotationPosition'].delete(
      locationJson(location),
    );
  }

  setCaptureHandler<L extends Location>(
    location: L,
    handler: AnnotationHandler<L>['onAnnotationCapture'],
  ) {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    if (!isDefined(handler)) {
      throw new Error('Invalid handler');
    }

    logApiCall('annotation', 'setCaptureHandler');

    this.annotationHandlers['onAnnotationCapture'].set(
      locationJson(location),
      handler,
    );
  }

  clearCaptureHandler(location: Location): void {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    this.annotationHandlers['onAnnotationCapture'].delete(
      locationJson(location),
    );
  }

  setClickHandler<L extends Location>(
    location: L,
    handler: AnnotationHandler<L>['onAnnotationClick'],
  ) {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    if (!isDefined(handler)) {
      throw new Error('Invalid handler');
    }

    logApiCall('annotation', 'setClickHandler');

    this.annotationHandlers['onAnnotationClick'].set(
      locationJson(location),
      handler,
    );
  }

  clearClickHandler(location: Location) {
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    this.annotationHandlers['onAnnotationClick'].delete(locationJson(location));
  }

  redrawAnnotations() {
    logApiCall('annotation', 'redrawAnnotations');
    const event = new CustomEvent(REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME, {
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(event);
  }

  async viewportCoordinatesToString(coords: Point2D): Promise<string | null> {
    const documentLocation = getDocumentLocation({
      xVsViewport: coords.x,
      yVsViewport: coords.y,
      highlightedTextConfig: null,
      excludeElementRef: null,
      logWarning: console.warn,
      thirdPartyObjects: null,
      hashAnnotations: false,
      iframeSelectors: [],
    });

    if (!documentLocation) {
      return null;
    }

    // Base64-encode to discourage folks from digging into the format and
    // depending on specifics of it, since our annotation logic is a mess and we
    // don't need to have wonky external dependencies on top of that.
    return base64.encode(JSON.stringify(documentLocation));
  }

  async stringToViewportCoordinates(str: string): Promise<Point2D | null> {
    try {
      const documentLocation = JSON.parse(base64.decode(str));
      const annotation = new AnnotationDecoder({ location: documentLocation });
      const position = await annotation.getPosition();
      if (position) {
        return {
          x: position.xVsViewport,
          y: position.yVsViewport,
        };
      }
    } catch (e) {
      // JSON parse error and the like. Just return the null.
    }

    return null;
  }
}

/**
 * Decides if the AnnotationRenderPosition provided by the developer has some useful
 * information inside, or it's not actually pointing at anything.
 */
const renderPositionIsDefined = (
  renderPosition: AnnotationRenderPosition | undefined,
) => renderPosition?.element || renderPosition?.coordinates;

/**
 * @param strictMatching If true, only return EXACT matches, or NONE. (I.e. no STALE)
 */
function findRenderPosition({
  annotation,
  coordsRelativeToTarget,
  handlers,
  strictMatching,
}: {
  annotation: Annotation;
  handlers: AnnotationHandlers;
  coordsRelativeToTarget: Point2D;
  strictMatching: boolean;
}):
  | { match: LocationMatch.NONE }
  | {
      match: LocationMatch.EXACT | LocationMatch.MAYBE_STALE;
      coordinates?: {
        x: number | string;
        y: number | string;
      };
      element?: HTMLElement;
    } {
  const handlerMatch = findHandlerMatchingLocation(
    handlers,
    'getAnnotationPosition',
    annotation.location,
  );

  const elementMatch = findElementMatchingLocation(annotation.location);

  // 1. if the developer registered a getAnnotationPosition handler for that exact location,
  // return the result of that handler (if anything was returned)
  if (handlerMatch.handler && handlerMatch.exact) {
    try {
      const renderPosition =
        handlerMatch.handler(annotation, coordsRelativeToTarget) ?? undefined;
      if (renderPositionIsDefined(renderPosition)) {
        return {
          match: LocationMatch.EXACT,
          ...renderPosition,
        } as const;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 2. if there is an element tagged with a data location attribute for that exact location, use that
  if (elementMatch.element && elementMatch.exact) {
    let coordinates: { x: string | number; y: string | number } = CENTER;

    if (coordsRelativeToTarget) {
      const targetRect = getDocumentPositionFromRect(
        elementMatch.element.getBoundingClientRect(),
      );

      if (targetRect) {
        coordinates = {
          x: targetRect.width * coordsRelativeToTarget.x,
          y: targetRect.height * coordsRelativeToTarget.y,
        };
      }
    }

    return {
      match: LocationMatch.EXACT,
      element: elementMatch.element,
      coordinates,
    } as const;
  }

  // 3. if a handler is registered that matches the location in less specific way, return the result of that
  // handler (if anything was returned). this is still marked as exact as we consider that the developer has
  // control and knowledge of returning the right position
  if (handlerMatch.handler) {
    try {
      const renderPosition =
        handlerMatch.handler(annotation, coordsRelativeToTarget) ?? undefined;
      if (renderPositionIsDefined(renderPosition)) {
        return {
          match: LocationMatch.EXACT,
          element: elementMatch.element ?? undefined,
          ...renderPosition,
        } as const;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 4. if an element is tagged with a data location attribute that matches the location in a less specific way,
  // use that element but mark it as MAYBE_STALE
  if (!strictMatching && elementMatch.element) {
    return {
      match: LocationMatch.MAYBE_STALE,
      element: elementMatch.element,
    } as const;
  }

  // 5. no element or handler matched this location, so we have no way of rendering this annotation pin
  return {
    match: LocationMatch.NONE,
  } as const;
}

export function AnnotationSDKProvider({
  annotationSDK,
  children,
}: React.PropsWithChildren<{
  annotationSDK: AnnotationSDK;
}>) {
  const handlersRef = useRef(annotationSDK.annotationHandlers);

  const onAnnotationCapture = useCallback(
    (
      location: Location,
      capturePosition: AnnotationCapturePosition,
      element: HTMLElement,
    ) => {
      return findHandlerMatchingLocation(
        handlersRef.current,
        'onAnnotationCapture',
        location,
      ).handler?.(capturePosition, element);
    },
    [],
  );

  const onAnnotationClick = useCallback(
    (annotation: AnnotationWithThreadID) => {
      return findHandlerMatchingLocation(
        handlersRef.current,
        'onAnnotationClick',
        annotation.location,
      ).handler?.(annotation);
    },
    [],
  );

  const computeAnnotationPosition = useCallback(
    ({
      annotation,
      coordsRelativeToTarget,
      strictMatching,
    }: {
      annotation: Annotation;
      coordsRelativeToTarget: Point2D;
      strictMatching: boolean;
    }) => {
      const renderPosition = findRenderPosition({
        annotation,
        handlers: handlersRef.current,
        coordsRelativeToTarget,
        strictMatching,
      });

      if (renderPosition.match === LocationMatch.NONE) {
        return renderPosition;
      }

      const renderPositionElementRect =
        renderPosition.element?.getBoundingClientRect();

      return {
        match: renderPosition.match,
        elementRect: renderPositionElementRect,
        element: renderPosition.element,
        ...getDocumentCoordinates(
          renderPosition.coordinates ?? CENTER,
          getDocumentPositionFromRect(renderPositionElementRect),
        ),
      };
    },
    [],
  );

  /**
   * Return annotation position only if there's an EXACT match.
   * Otherwise, return NONE. This is what FloatingThreads component use.
   */
  const getAnnotationPositionStrict = useCallback(
    (annotation: Annotation, coordsRelativeToTarget: Point2D) => {
      return computeAnnotationPosition({
        annotation,
        coordsRelativeToTarget,
        strictMatching: true,
      });
    },
    [computeAnnotationPosition],
  );

  /**
   * A smarter version of `getAnnotationPositionStrict`. This function
   * uses some heuristic to return "maybe stale" annotations.
   */
  const getAnnotationPosition = useCallback(
    (annotation: Annotation, coordsRelativeToTarget: Point2D) => {
      return computeAnnotationPosition({
        annotation,
        coordsRelativeToTarget,
        strictMatching: false,
      });
    },
    [computeAnnotationPosition],
  );

  const contextValue = useMemo(
    () => ({
      onAnnotationCapture,
      getAnnotationPosition,
      getAnnotationPositionStrict,
      onAnnotationClick,
    }),
    [
      onAnnotationCapture,
      getAnnotationPosition,
      getAnnotationPositionStrict,
      onAnnotationClick,
    ],
  );

  return (
    <AnnotationSDKContext.Provider value={contextValue}>
      {children}
    </AnnotationSDKContext.Provider>
  );
}
