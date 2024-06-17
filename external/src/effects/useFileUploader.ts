import type { Buffer } from 'buffer';
import { useCallback, useMemo } from 'react';
import type { ApolloClient } from '@apollo/client';
import { useApolloClient } from '@apollo/client';
import type {
  CreateFileMutationResult,
  CreateFileMutationVariables,
  FileUploadStatus,
  RefreshFileUploadURLMutationResult,
  RefreshFileUploadURLMutationVariables,
  SetFileUploadStatusMutationResult,
  SetFileUploadStatusMutationVariables,
} from 'external/src/graphql/operations.ts';
import {
  SetFileUploadStatusMutation,
  RefreshFileUploadURLMutation,
  CreateFileMutation,
} from 'external/src/graphql/operations.ts';
import type { JsonObject, UUID } from 'common/types/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

export type FileForUpload = {
  id: string;
  mimeType: string;
  uploadURL: string | null;
  downloadURL: string;
};

export async function createFileForUpload(
  {
    apolloClient,
    id,
    name,
    mimeType,
    threadOrgID,
  }: {
    apolloClient: ApolloClient<any>;
    id: UUID;
    name: string;
    mimeType: string;
    threadOrgID?: UUID; // will default to viewer if not passed
  },
  size?: number,
): Promise<FileForUpload | null> {
  const { data } = await apolloClient.mutate<
    CreateFileMutationResult,
    CreateFileMutationVariables
  >({
    mutation: CreateFileMutation,
    variables: {
      id,
      name,
      mimeType,
      size,
      threadOrgID,
    },
  });
  if (!data) {
    return null;
  }
  return {
    id,
    mimeType,
    uploadURL: data.createFile.uploadURL,
    downloadURL: data.createFile.downloadURL,
  };
}

export async function uploadFile({
  apolloClient,
  id,
  mimeType,
  uploadURL,
  buffer,
  updateLocalFileUploadStatus,
  threadOrgID,
  logError,
}: {
  apolloClient: ApolloClient<any>;
  id: UUID;
  mimeType: string;
  uploadURL: string | null;
  buffer: Buffer;
  updateLocalFileUploadStatus?: (status: FileUploadStatus) => void;
  threadOrgID?: UUID; // will default to viewer if not passed
  logError?: (
    type: string,
    payload?: JsonObject,
    metadata?: JsonObject,
  ) => void;
}) {
  if (!uploadURL) {
    uploadURL = (
      await apolloClient.mutate<
        RefreshFileUploadURLMutationResult,
        RefreshFileUploadURLMutationVariables
      >({
        mutation: RefreshFileUploadURLMutation,
        variables: {
          id,
          size: buffer.length,
        },
      })
    ).data!.refreshFileUploadURL;
  }

  async function uploadFileDirectly() {
    let fileUploadStatus: FileUploadStatus = 'uploading';
    try {
      const putResponse = await fetch(uploadURL!, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (putResponse.status !== 200) {
        // AWS returns error details as XML
        const errorStr = await putResponse.text();
        throw new Error(
          `Upload failed with status ${putResponse.status}. Error details: ${errorStr}`,
        );
      }

      const updateStatusResponse = await apolloClient.mutate<
        SetFileUploadStatusMutationResult,
        SetFileUploadStatusMutationVariables
      >({
        mutation: SetFileUploadStatusMutation,
        variables: {
          id,
          status: 'uploaded',
          threadOrgID,
        },
      });

      fileUploadStatus =
        updateStatusResponse.data?.setFileUploadStatus.success === true
          ? 'uploaded'
          : 'failed';
    } catch (error: any) {
      fileUploadStatus = 'failed';
      logError?.('attachment-upload-failed', {
        error: error.toString(),
        uploadURL,
      });
    }

    return fileUploadStatus;
  }

  return await new Promise<FileUploadStatus>((resolve) => {
    void uploadFileDirectly().then((status) => {
      updateLocalFileUploadStatus?.(status);
      resolve(status);
    });
  });
}

export function useFileUploader() {
  const apolloClient = useApolloClient();
  const { logError } = useLogger();

  const createFileForUploadCallback = useCallback(
    async (
      {
        id,
        name,
        mimeType,
        threadOrgID,
      }: {
        id: UUID;
        name: string;
        mimeType: string;
        threadOrgID?: UUID; // will default to viewer if not passed
      },
      size?: number,
    ): Promise<FileForUpload | null> =>
      await createFileForUpload(
        {
          apolloClient,
          id,
          name,
          mimeType,
          threadOrgID,
        },
        size,
      ),
    [apolloClient],
  );

  const uploadFileCallback = useCallback(
    async ({
      id,
      mimeType,
      uploadURL,
      buffer,
      updateLocalFileUploadStatus,
      threadOrgID,
    }: {
      id: UUID;
      mimeType: string;
      uploadURL: string | null;
      buffer: Buffer;
      updateLocalFileUploadStatus?: (status: FileUploadStatus) => void;
      threadOrgID?: UUID; // will default to viewer if not passed
    }) =>
      await uploadFile({
        apolloClient,
        id,
        mimeType,
        uploadURL,
        buffer,
        updateLocalFileUploadStatus,
        threadOrgID,
        logError,
      }),
    [logError, apolloClient],
  );

  return useMemo(
    () => ({
      uploadFile: uploadFileCallback,
      createFileForUpload: createFileForUploadCallback,
    }),
    [createFileForUploadCallback, uploadFileCallback],
  );
}
