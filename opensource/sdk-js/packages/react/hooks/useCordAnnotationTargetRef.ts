import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Location, AnnotationHandler } from '@cord-sdk/types';
import {
  CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
  locationJson,
} from '@cord-sdk/types';
import { useCordContext } from '../contexts/CordContext.js';
import { useMemoizedLocation } from './useMemoizedLocation.js';

const doNothing = () => {};

export function useCordAnnotationRenderer<L extends Location = Location>(
  location: Partial<L>,
  handler: AnnotationHandler<L>['getAnnotationPosition'],
): { redrawAnnotations: () => void } {
  const { sdk } = useCordContext('useCordAnnotationRenderer');

  const memoizedLocation = useMemoizedLocation(location);

  useEffect(() => {
    if (!handler || !sdk) {
      return;
    }

    sdk.annotation.setRenderHandler(memoizedLocation, handler);

    return () => {
      sdk.annotation.clearRenderHandler(memoizedLocation);
    };
  }, [sdk, memoizedLocation, handler]);

  return {
    redrawAnnotations: sdk?.annotation.redrawAnnotations ?? doNothing,
  };
}

export function useCordAnnotationCaptureHandler<L extends Location = Location>(
  location: Partial<L>,
  handler: AnnotationHandler<L>['onAnnotationCapture'],
) {
  const { sdk } = useCordContext('useCordAnnotationCaptureHandler');
  const memoizedLocation = useMemoizedLocation(location);

  useEffect(() => {
    if (!handler || !sdk) {
      return;
    }

    sdk.annotation.setCaptureHandler(memoizedLocation, handler);

    return () => {
      sdk.annotation.clearCaptureHandler(memoizedLocation);
    };
  }, [sdk, memoizedLocation, handler]);
}

export function useCordAnnotationClickHandler<L extends Location = Location>(
  location: Partial<L>,
  handler: AnnotationHandler<L>['onAnnotationClick'],
) {
  const { sdk } = useCordContext('useCordAnnotationClickHandler');
  const memoizedLocation = useMemoizedLocation(location);

  useEffect(() => {
    if (!handler || !sdk) {
      return;
    }

    sdk.annotation.setClickHandler(memoizedLocation, handler);

    return () => {
      sdk.annotation.clearClickHandler(memoizedLocation);
    };
  }, [sdk, memoizedLocation, handler]);
}

function useRefWithUpdateBehaviour<E extends HTMLElement>(
  callback: (element: E | null) => unknown,
  cleanup?: (element: E | null) => unknown,
): React.MutableRefObject<E | null> {
  const elementRef = useRef<E | null>(null);

  return useMemo(
    () => ({
      get current() {
        return elementRef.current;
      },
      set current(value) {
        if (elementRef.current !== value) {
          cleanup?.(elementRef.current);
          elementRef.current = value;
          callback(value);
        }
      },
    }),
    [callback, cleanup],
  );
}

export function useCordAnnotationTargetRef<
  E extends HTMLElement,
  L extends Location = Location,
>(location: Partial<L>) {
  const locationString = locationJson(location);

  const setCordLocationAttribute = useCallback(
    (element: E | null) => {
      element?.setAttribute(
        CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
        locationString,
      );
    },
    [locationString],
  );

  const removeCordLocationAttribute = useCallback((element: E | null) => {
    element?.removeAttribute(CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE);
  }, []);

  return useRefWithUpdateBehaviour<E>(
    setCordLocationAttribute,
    removeCordLocationAttribute,
  );
}
