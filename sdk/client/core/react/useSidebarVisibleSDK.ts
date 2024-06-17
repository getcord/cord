import { useEffect } from 'react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { GlobalContext } from 'external/src/context/global/GlobalContext.tsx';

export function useSidebarVisibleSDK(open?: boolean | undefined) {
  const { sidebarVisible, setSidebarVisible } =
    useContextThrowingIfNoProvider(GlobalContext);

  useEffect(() => {
    if (open !== undefined) {
      setSidebarVisible(open);
    }
  }, [open, setSidebarVisible]);

  return [sidebarVisible ?? false, setSidebarVisible] as const;
}
