import { useEffect, useState } from 'react';

export function useMutationObserver(
  targetElement: HTMLElement | null,
  handleMutation: MutationCallback,
) {
  const [observer, setObserver] = useState<MutationObserver | null>(null);

  useEffect(() => {
    const obs = new MutationObserver(handleMutation);
    setObserver(obs);
  }, [handleMutation, setObserver]);

  useEffect(() => {
    if (!observer || !targetElement) {
      return;
    }
    observer.observe(targetElement, { attributes: true });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [observer, targetElement]);
}
