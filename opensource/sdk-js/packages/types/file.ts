import type { UserID } from './core.js';

export interface UploadedFile {
  /**
   * The ID of the file.
   */
  id: string;
  /**
   * The name of the file.
   */
  name: string;
  /**
   * The URL that a user can use to download the file.  This is a signed URL
   * that will expire after 24 hours.
   */
  url: string;
  /**
   * The MIME type of the file.
   */
  mimeType: string;
  /**
   * The size of the file, in bytes.
   */
  size: number;
  /**
   * The status of the file upload.  `uploading` means that the user has not yet
   * completed uploading the file, `uploaded` means the file is successfully
   * uploaded, `failed` means the upload encountered an error, and `cancelled`
   * means the user cancelled the upload before it was finished or the upload
   * timed out.
   */
  uploadStatus: 'uploading' | 'uploaded' | 'failed' | 'cancelled';
}

export type ClientCreateFile = {
  /**
   * The name of the file.  This will be shown to the user when attached to a
   * message and will be the file's name if it's downloaded.
   */
  name: string;
  /**
   * The file contents, such as from a file input element.
   */
  blob: Blob;
};

export type UploadedFileData = {
  /**
   * The id of the file when it has successfully been uploaded.
   */
  id: string;
  /**
   * The URL to download the file.  This is a signed URL that will
   * expire after 24 hours.
   */
  url: string;
};

export type UploadFileResult = {
  /**
   * The identifier for the file, which can be passed to other APIs to reference
   * this file.
   */
  id: string;
  /**
   * A promise that will be fulfilled when the file is successfully uploaded to
   * the file storage backend or rejected if there is an error uploading the file.
   */
  uploadPromise: Promise<UploadedFileData>;
};

export interface ICordFileSDK {
  /**
   * Upload a file to Cord's file storage for use in other Cord APIs, such as
   * [attaching to a
   * message](https://docs.cord.com/js-apis-and-hooks/thread-api/sendMessage#addAttachments).
   * Because uploading the file contents may take a long time, this works in two
   * steps.  First, the file record is created, and then the file is uploaded
   * directly from the browser to the file storage. You can reference the file
   * in other APIs as soon as the first step is complete.
   *
   * Certain types of files, such as executable code, cannot be uploaded. Trying
   * to do so will generate an error.
   *
   * Files that are uploaded but never attached to a message will eventually be
   * garbage collected.
   * @example Overview
   * ```javascript
   * const { id } = await window.CordSDK.file.uploadFile({
   *   name: myFileInput.files[0].name,
   *   blob: myFileInput.files[0],
   * });
   * ```
   * @param data The file to upload.
   * @returns A promise that resolves once the file has been allocated an ID by
   * the backend.  At that point, it is safe to reference the file in other
   * APIs, though the file may not be fully uploaded to the file storage yet and
   * could still fail. If you want to know when the file upload is fully
   * complete, you can await the `uploadPromise` property on the return value.
   */
  uploadFile(data: ClientCreateFile): Promise<UploadFileResult>;
}

export type ServerCreateFile = {
  /**
   * The ID of the user that owns the file.  Files can only be attached to
   * messages authored by their owner.
   */
  ownerID: UserID;
  /**
   * The name of the file.  This will be shown to the user when attached to a
   * message and will be the file's name if it's downloaded.  If not supplied,
   * it will be taken from the filename of the `file` parameter.
   */
  name?: string;
};
