import { createContext, useCallback, useMemo, useState } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { ImageModal2 } from 'external/src/delegate/components/2/ImageModal2.tsx';
import type { UserFragment } from 'external/src/graphql/operations.ts';

type MediaData = {
  mediaIndex: number;
  medias: {
    url: string;
    mimeType: string;
    id: string;
  }[];
  small?: boolean;
  blurred?: boolean;
  onUnsupportedVideoFormat?: (id: string) => unknown;
  banner: {
    isAnnotation: boolean;
    user: UserFragment;
    timestamp: Date;
  } | null;
};

export type MediaModal = MediaData & {
  closeModal: () => void;
};

type MediaModalContextType = {
  showMediaModal: (data: MediaData) => void;
  hideSmallMediaModal: () => void;
  mediaModal: MediaModal | null;
};

export const MediaModalContext = createContext<
  MediaModalContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

type Props = {
  fullWidth: boolean;
};

export function MediaModalProvider({
  children,
  fullWidth,
}: React.PropsWithChildren<Props>) {
  const [mediaModal, setMediaModal] = useState<MediaModal | null>(null);

  const showNext = useCallback(() => {
    setMediaModal(
      (state) =>
        state && {
          ...state,
          mediaIndex: (state.mediaIndex + 1) % state.medias.length,
        },
    );
  }, []);
  const showPrevious = useCallback(() => {
    setMediaModal(
      (state) =>
        state && {
          ...state,
          mediaIndex:
            (state.medias.length + state.mediaIndex - 1) % state.medias.length,
        },
    );
  }, []);
  const showMediaModal = useCallback((data: MediaData) => {
    setMediaModal({ ...data, closeModal: () => setMediaModal(null) });
  }, []);

  const hideSmallMediaModal = useCallback(() => {
    if (mediaModal?.small) {
      setMediaModal(null);
    }
  }, [mediaModal]);

  const contextValue = useMemo(
    () => ({
      mediaModal,
      showMediaModal,
      hideSmallMediaModal,
    }),
    [mediaModal, showMediaModal, hideSmallMediaModal],
  );

  return (
    <MediaModalContext.Provider value={contextValue}>
      {mediaModal && (
        <ImageModal2
          showNext={showNext}
          showPrevious={showPrevious}
          fullWidth={fullWidth}
          {...mediaModal}
        />
      )}
      {children}
    </MediaModalContext.Provider>
  );
}
