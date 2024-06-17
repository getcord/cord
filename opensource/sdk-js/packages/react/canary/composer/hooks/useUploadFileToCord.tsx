import type { UploadedFile } from '@cord-sdk/types';
import { useCallback, useContext } from 'react';
import { readFileAsync } from '../../../common/lib/uploads.js';
import { CordContext } from '../../../contexts/CordContext.js';

export function useUploadFileToCord(
  editAttachment: (
    attachment: UploadedFile | Omit<UploadedFile, 'url'>,
  ) => void,
) {
  const { sdk: cord } = useContext(CordContext);

  const attachFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const { id, uploadPromise } = await cord!.file.uploadFile({
          name: file.name,
          blob: file,
        });

        // Let's not wait for the file to be uploaded
        // before showing something in the UI.
        // Some time in the future, we'll update the `uploadedState`
        void uploadPromise.then(
          ({ url }) =>
            editAttachment({
              id,
              name: file.name,
              uploadStatus: 'uploaded',
              url,
              mimeType: file.type,
              size: file.size,
            }),
          () =>
            editAttachment({
              id,
              name: file.name,
              uploadStatus: 'failed',
              mimeType: file.type,
              size: file.size,
            }),
        );

        // Before we have the URL to the resource, we can still
        // show a preview by passing the dataURL to the `img`
        const dataURL = await readFileAsync(file);
        const uploadedFile: UploadedFile = {
          id,
          name: file.name,
          url: dataURL,
          mimeType: file.type,
          size: file.size,
          uploadStatus: 'uploading',
        };

        // TODO do in batch, not one by one
        editAttachment(uploadedFile);
      }
    },
    [cord, editAttachment],
  );

  return attachFiles;
}
