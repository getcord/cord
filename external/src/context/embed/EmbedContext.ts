import { createContext } from 'react';
import type {
  DocumentAnnotationResult,
  MessageAnnotation,
  LocationMatch,
  Point2D,
  Location,
} from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

// TODO: This is only available for Sidebar.  The EmbedContext was really an
// extension/sidebar era thing which we now only wrap around the Sidebar component
// (see SidebarProviders).  Do NOT try and use these methods in other components,
// and we should retire this Sidebar-specific code.  The good news is most of it
// relates to behaviour which is only available in the Sidebar, e.g. about pointing
// to annotations on the page.

export type EmbedContextProps = {
  supportsAnnotations: boolean;
  visible: boolean;
  navigate: (url: string) => void;
  createAnnotation: () => Promise<DocumentAnnotationResult | null>;
  cancelAnnotation: () => void;
  showAnnotation: (annotation: MessageAnnotation) => void;
  skipToAnnotatedTime: (annotation: MessageAnnotation) => void;
  hideAnnotation: (annotation: MessageAnnotation) => void;
  drawArrowToAnnotation: (
    annotation: MessageAnnotation,
    fromPosition: Point2D,
  ) => void;
  scrollToAnnotation: (annotation: MessageAnnotation) => Promise<void>;
  removeAnnotationArrow: (
    annotation: MessageAnnotation,
    animate?: boolean,
  ) => void;
  getAnnotationMatchType: (
    annotation: MessageAnnotation,
  ) => Promise<LocationMatch>;
  showConfirmModal: (data: {
    title: string;
    paragraphs: string[];
    onConfirm: () => void;
    onCancel: () => void;
    confirmButtonText: string;
    cancelButtonText: string;
  }) => void;
  preloadImage: (imageUrl: string) => void;
  showThirdPartyAuthDataModal: (data?: {
    teamName?: string;
    title?: string;
    body?: string;
  }) => void;
  hideThirdPartyAuthDataModal: () => void;
  proxyNavigateOverride:
    | ((
        url: string,
        location: Location | null,
        info: { orgID: string; threadID: string; groupID: string },
      ) => Promise<boolean>)
    | null;
};

export const EmbedContext = createContext<
  EmbedContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
