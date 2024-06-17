import { useCallback } from 'react';

import type { UUID } from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { MediaModal } from 'external/src/context/mediaModal/MediaModalContext.tsx';
import { MediaModalContext } from 'external/src/context/mediaModal/MediaModalContext.tsx';
import type {
  FileFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';

export function useMediaModal(
  medias: { url: string; mimeType: FileFragment['mimeType']; id: string }[],
  options?: { onUnsupportedVideoFormat: (id: UUID) => unknown },
) {
  const { showMediaModal } = useContextThrowingIfNoProvider(MediaModalContext);
  const { onUnsupportedVideoFormat } = options ?? {};

  return useCallback(
    ({
      mediaIndex,
      small,
      blurred,
      bannerConfig,
    }: {
      mediaIndex: number;
      small?: boolean;
      blurred?: boolean;
      bannerConfig?: {
        timestamp: string;
        source: UserFragment;
        attachmentType: MessageAttachmentType;
      } | null;
    }) => {
      if (medias.length <= mediaIndex) {
        return;
      }
      let banner: MediaModal['banner'] = null;
      if (bannerConfig) {
        banner = {
          isAnnotation:
            bannerConfig.attachmentType === MessageAttachmentType.ANNOTATION,
          user: bannerConfig.source,
          timestamp: new Date(bannerConfig.timestamp),
        };
      }
      showMediaModal({
        mediaIndex,
        medias,
        small,
        blurred,
        banner,
        onUnsupportedVideoFormat,
      });
    },
    [medias, showMediaModal, onUnsupportedVideoFormat],
  );
}
