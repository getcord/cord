import { forwardRef, useRef, useCallback, useEffect } from 'react';
import { betaV2 } from '@cord-sdk/react';

import { useComposedRefs } from 'docs/server/hooks/composeRefs.tsx';

const HIDE_AFTER_MOUSE_LEAVE_TIMEOUT = 10000;

export const AutoClickOnHoverButton = forwardRef(
  function AutoClickOnHoverButton(
    props: betaV2.GeneralButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const showMenu = useCallback(() => {
      buttonRef.current && buttonRef.current.click();
    }, []);

    const composedRefs = useComposedRefs(ref, buttonRef);

    return (
      <betaV2.Button {...props} ref={composedRefs} onMouseEnter={showMenu} />
    );
  },
);

export const AutoClickAndHideButton = forwardRef(
  function AutoClickAndHideButton(
    props: betaV2.GeneralButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMouseLeave = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(escEvent);
      }, HIDE_AFTER_MOUSE_LEAVE_TIMEOUT);
    }, []);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <AutoClickOnHoverButton
        {...props}
        ref={ref}
        onMouseLeave={onMouseLeave}
      />
    );
  },
);
