import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

// This context provides the root element for globally positioned elements
// like AnnotationArrow, Overlay, tooltips, etc
export const PortalContext = createContext<
  HTMLElement | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
