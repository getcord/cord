import { useEffect, useMemo, useRef } from 'react';
import { useUpdatingRef } from './useUpdatingRef.js';

type Args = {
  capture?: boolean;
  disabled?: boolean;
  elementRef?: React.RefObject<HTMLElement>;
  // This is intentionally a `mousedown` instead of a `click` event, because `click`
  // events only fire after a `mouseup` event, which means if users click, hold and drag
  // the cursor they could select text without triggering useClickOutside's callback
  onMouseDown: ((event: Event) => void) | undefined;
};

export function useClickOutside(args: Args) {
  const elementRef = args.elementRef;
  const elements = useMemo(
    () => (elementRef ? [elementRef] : []),
    [elementRef],
  );
  useClickOutsideMany({ ...args, elements });
}

// Listens for mousedown on document outside of the provided element
export function useClickOutsideMany({
  capture = false,
  disabled,
  onMouseDown,
  elements,
}: Omit<Args, 'elementRef'> & { elements: React.RefObject<HTMLElement>[] }) {
  disabled = disabled || !onMouseDown;
  // Use ref so we can pass inline function without re-adding the listeners every time
  const onMouseDownRef = useUpdatingRef(onMouseDown);

  const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (disabled) {
      return;
    }
    const handleOnMouseDown = (event: MouseEvent) => {
      if (!event.isTrusted) {
        return;
      }

      if (
        event
          .composedPath()
          .find(
            (element) => (element as HTMLElement)?.nodeName === 'EMOJI-PICKER',
          )
      ) {
        return;
      }

      const elementsToSkip = new Set<EventTarget>(
        elements.map((e) => e.current).filter((e): e is HTMLElement => !!e),
      );
      if (
        elementsToSkip.size > 0 &&
        // Use composedPath as event.target doesn't work with shadowDOM, and
        // could be stale by the time we reach this handler anyway
        event.composedPath().some((elem) => elementsToSkip.has(elem))
      ) {
        // Click is not outside element - ignore
        return;
      }
      onMouseDownRef.current?.(event);
    };

    // This timeout avoids the clickListener being fired immediately as an
    // element mounts. An example of what happens without this:
    // - You click to show task type menu in ComposerTask
    // - It mounts, and calls useClickOutside with a listener that closes itself
    // - The listener fires immediately and so the menu closes (looks like it never appears)
    // More info: https://github.com/facebook/react/issues/20636#issuecomment-764878815
    timeoutRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleOnMouseDown, capture);
    }, 0);
    const timeout = timeoutRef.current;
    return () => {
      document.removeEventListener('mousedown', handleOnMouseDown, capture);

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [capture, disabled, elements, onMouseDownRef]);
}
