import { GlobalContext } from 'external/src/context/global/GlobalContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

// control whether Cord is open/collapsed right now in the current page
export function useSidebarVisible() {
  const { sidebarVisible, setSidebarVisible } =
    useContextThrowingIfNoProvider(GlobalContext);

  return [sidebarVisible, setSidebarVisible] as const;
}
