import { useCallback } from 'react';
import { useGetSignedUploadURLMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import type { ApplicationAssetNameType } from 'common/uploads/index.ts';

export function useConsoleAssetFileUploader() {
  const [getSignedUploadURL] = useGetSignedUploadURLMutation();

  return useCallback(
    async (id: UUID, file: File, assetName: ApplicationAssetNameType) => {
      const buffer = await file.arrayBuffer();

      const { data } = await getSignedUploadURL({
        variables: {
          applicationID: id,
          assetName,
          size: file.size,
          mimeType: file.type,
        },
      });

      if (!data) {
        throw new Error('An unexpected error has ocurred. Please try again.');
      }

      const { uploadURL, downloadURL } = data.getSignedUploadURL;

      const response = await fetch(uploadURL!, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.status !== 200) {
        const error = await response.text();
        throw new Error(
          `Upload failed with status ${response.status}. Error details: ${error}`,
        );
      }
      return downloadURL;
    },
    [getSignedUploadURL],
  );
}
