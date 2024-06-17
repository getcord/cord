const ALLOWED_INLINE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/apng',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
];

const ALLOWED_INLINE_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

/**
 * Returns whether the given file should be rendered as an inline image.  If
 * false, the file should be rendered as a download link.
 */
export function isInlineDisplayableImage(mimeType: string) {
  return ALLOWED_INLINE_IMAGE_MIME_TYPES.includes(mimeType);
}

export function isInlineDisplayableVideo(mimeType: string) {
  return ALLOWED_INLINE_VIDEO_MIME_TYPES.includes(mimeType);
}

export const readFileAsync = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
