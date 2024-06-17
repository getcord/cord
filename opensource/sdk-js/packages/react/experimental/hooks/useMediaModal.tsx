import * as React from 'react';
import { useCallback, useState } from 'react';
import type { ClientUserData } from '@cord-sdk/types';
import { MediaModal } from '../components/MediaModal.js';
import type { MediaModalProps } from '../components/MediaModal.js';

export function useMediaModal({
  medias,
  user,
  createdAt,
}: {
  medias: MediaModalProps['medias'];
  user: ClientUserData | null | undefined;
  createdAt?: Date;
}): [React.JSX.Element | null, (mediaIndex: number) => void] {
  const [mediaModalProps, setMediaModalProps] =
    useState<MediaModalProps | null>(null);
  const handleCloseModal = useCallback(() => {
    setMediaModalProps(null);
  }, []);

  const openMediaModal = useCallback(
    (mediaIndex: number) => {
      setMediaModalProps({
        initialMediaIndex: mediaIndex,
        banner: user && createdAt ? { user, timestamp: createdAt } : null,
        closeModal: handleCloseModal,
        medias,
      });
    },
    [createdAt, handleCloseModal, medias, user],
  );

  const mediaModal = mediaModalProps ? (
    <MediaModal {...mediaModalProps} canBeReplaced />
  ) : null;

  return [mediaModal, openMediaModal];
}
