import { createContext, useMemo } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type AnnotationsConfigContextValue = {
  /**
   * When false, we don't even run the query to fetch pins on page.
   */
  showPinsOnPage: boolean;
};

export const AnnotationsConfigContext = createContext<
  AnnotationsConfigContextValue | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function AnnotationsConfigProvider({
  children,
  showPinsOnPage,
}: React.PropsWithChildren<AnnotationsConfigContextValue>) {
  const ctx = useMemo(() => ({ showPinsOnPage }), [showPinsOnPage]);
  return (
    <AnnotationsConfigContext.Provider value={ctx}>
      {children}
    </AnnotationsConfigContext.Provider>
  );
}
