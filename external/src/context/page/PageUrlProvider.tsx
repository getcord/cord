import { format } from 'url';
import { useEffect, useState } from 'react';
import { PageUrlContext } from 'external/src/context/page/PageUrlContext.ts';
import { cleanupURL } from 'common/page_context/util.ts';
import { watchForLocationChanges } from 'external/src/lib/watchers.ts';

export function PageUrlProvider({ children }: React.PropsWithChildren<any>) {
  const [pageUrl, setPageUrl] = useState<string | null>(null);

  useEffect(() => {
    const updateUrl = () => {
      setPageUrl(format(cleanupURL(window.location.href)));
    };

    updateUrl();

    const removeLocationChangesWatcher = watchForLocationChanges(updateUrl);
    return () => {
      removeLocationChangesWatcher();
    };
  }, [setPageUrl]);

  return (
    <PageUrlContext.Provider value={pageUrl}>
      {children}
    </PageUrlContext.Provider>
  );
}
