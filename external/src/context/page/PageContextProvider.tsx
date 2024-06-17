import { useEffect, useState } from 'react';
import type { PageContext as PageContextType } from 'common/types/index.ts';
import { pageContextEqual } from 'common/types/index.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { ThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { PageUrlContext } from 'external/src/context/page/PageUrlContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { watchForDocumentTitleChanges } from 'external/src/lib/watchers.ts';
import { getDocumentTitle } from 'common/page_context/util.ts';

export function PageContextProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const [pageContext, setPageContext] = useState<PageContextType | null>(null);
  const [threadName, setThreadName] = useState<string | null>(null);
  const pageUrl = useContextThrowingIfNoProvider(PageUrlContext);

  useEffect(() => {
    if (pageUrl === null) {
      return;
    }

    const updatePageContext = () => {
      const newPageContext = {
        providerID: null,
        data: { location: pageUrl },
      };
      const pageName = getDocumentTitle(document) ?? null;

      setPageContext((currentPageContext) =>
        pageContextEqual(currentPageContext, newPageContext)
          ? currentPageContext
          : newPageContext,
      );
      setThreadName(pageName);
    };

    // initial page context
    updatePageContext();

    // Watch for Title changes
    const removeTitleChangeWatcher =
      watchForDocumentTitleChanges(updatePageContext);
    return () => {
      removeTitleChangeWatcher();
    };
  }, [pageUrl]);

  return (
    <PageContext.Provider value={pageContext}>
      <ThreadNameContext.Provider value={{ threadName, default: true }}>
        {children}
      </ThreadNameContext.Provider>
    </PageContext.Provider>
  );
}
