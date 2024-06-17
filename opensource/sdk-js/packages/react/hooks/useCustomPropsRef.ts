import { useCallback } from 'react';
import type { HTMLCordElement } from '@cord-sdk/types';

/**
 * This hooks helps assigning non scalar props into our public web-components
 *
 * Web components cannot get complex attributes,
 * instead we need to grab ref to the element and write a property on that element.
 *
 *  This not very convenient to do manually.
 *  This hook helps with that, and is particularly useful for our public React components.
 *
 **/
export function useCustomPropsRef<
  Props extends Record<string, unknown>,
  HTMLElementInterface extends HTMLCordElement,
>(props: Props, ref: (element: HTMLElementInterface | null) => void) {
  return useCallback(
    (e: HTMLElementInterface | null) => {
      if (e) {
        Object.assign(e, props);
      }
      ref(e);
    },
    [ref, props],
  );
}
