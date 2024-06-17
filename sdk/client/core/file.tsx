import type { ApolloClient } from '@apollo/client';

import { v4 as uuid } from 'uuid';
import type {
  ClientCreateFile,
  ICordFileSDK,
  UploadFileResult,
} from '@cord-sdk/types';
import {
  createFileForUpload,
  uploadFile,
} from 'external/src/effects/useFileUploader.ts';
import {
  bufferFromDataURL,
  readFileAsync,
  validateFileForUpload,
} from 'common/uploads/index.ts';

export class FileSDK implements ICordFileSDK {
  constructor(private client: ApolloClient<any>) {}

  async uploadFile(data: ClientCreateFile): Promise<UploadFileResult> {
    const id = uuid();
    const validation = validateFileForUpload('attachment', {
      name: data.name,
      mimeType: data.blob.type,
      size: data.blob.size,
    });
    if (!validation.valid) {
      if (!validation.size) {
        throw new Error(`File ${validation.input.name} is too large`);
      } else {
        throw new Error(`Cannot attach file ${validation.input.name}`);
      }
    }
    const result = await createFileForUpload(
      {
        apolloClient: this.client,
        id,
        name: data.name,
        mimeType: data.blob.type,
      },
      data.blob.size,
    );

    if (!result) {
      throw new Error(`Unable to upload file ${data.name}`);
    }

    return {
      id,
      uploadPromise: (async (): UploadFileResult['uploadPromise'] => {
        const dataURL = await readFileAsync(data.blob);
        const buffer = bufferFromDataURL(dataURL);

        const status = await uploadFile({
          apolloClient: this.client,
          id,
          mimeType: data.blob.type,
          uploadURL: result.uploadURL,
          buffer,
        });
        if (status !== 'uploaded') {
          // TODO(flooey): It'd be good to get more info here
          throw new Error(`Unable to upload file ${data.name}`);
        }
        return { id, url: result.downloadURL };
      })(),
    };
  }
}
