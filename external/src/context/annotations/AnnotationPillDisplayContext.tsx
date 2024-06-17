import * as React from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type AnnotationPillDisplayContextProps = {
  hidden: boolean;
};
export const AnnotationPillDisplayContext = React.createContext<
  AnnotationPillDisplayContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

const DO_NOT_EXPORT_defaultAnnotationPillDisplay = { hidden: false };
/**
 * AnnotationPillDisplayContext controls whether we show the annotation pill in a message.
 * Some components hide it (e.g. FloatingThreads). This is done via a provider which serves
 * hidden: true.
 * For other components who also display messages (e.g. Inbox), we currently don't hide the annotation
 * pill - we wrap such components with this disabled provider.
 */
export function DisabledAnnotationPillDisplayProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <AnnotationPillDisplayContext.Provider
      value={DO_NOT_EXPORT_defaultAnnotationPillDisplay}
    >
      {children}
    </AnnotationPillDisplayContext.Provider>
  );
}
