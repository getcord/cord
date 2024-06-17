import { v4 as uuid } from 'uuid';
import type { Screenshot, ScreenshotConfig } from '@cord-sdk/types';
import { urlToScreenshotDataUrl } from 'external/src/lib/nativeScreenshot/util/urlToScreenshotDataUrl.ts';
import { NativeScreenshotter } from 'external/src/lib/nativeScreenshot/index.ts';
import type {
  FileForUpload,
  useFileUploader,
} from 'external/src/effects/useFileUploader.ts';
import {
  bufferFromDataURL,
  validateFileForUpload,
} from 'common/uploads/index.ts';
import type { useLogger } from 'external/src/logging/useLogger.ts';

export type CaptureScreenshot = {
  logger: ReturnType<typeof useLogger>;
  sidebarVisible: boolean;
  blurScreenshotsOnCapture: boolean;
  screenshotConfig: ScreenshotConfig;
  takeScreenshotOfCanvasOnly: boolean;
  createFileForUpload: ReturnType<
    typeof useFileUploader
  >['createFileForUpload'];
  uploadFile: ReturnType<typeof useFileUploader>['uploadFile'];
};

export async function captureScreenshot({
  logger,
  sidebarVisible,
  blurScreenshotsOnCapture,
  screenshotConfig,
  takeScreenshotOfCanvasOnly,
  createFileForUpload,
  uploadFile,
}: CaptureScreenshot) {
  const mimeType = 'image/png';
  const screenshot: Screenshot = {
    id: uuid(),
    mimeType,
    name: 'capture.png',
    uploadStatus: 'uploading' as const,
    url: '',
    size: 0,
  };

  const blurredScreenshot: Screenshot | null = blurScreenshotsOnCapture
    ? {
        id: uuid(),
        mimeType,
        name: 'capture-blurred.png',
        uploadStatus: 'uploading' as const,
        url: '',
        size: 0,
      }
    : null;

  const getScreenshotURL = new Promise<{
    regular: string;
    blurred: string | undefined;
  } | null>((resolve) => {
    if (screenshotConfig?.screenshotUrlOverride) {
      urlToScreenshotDataUrl({
        url: screenshotConfig.screenshotUrlOverride,
        blurScreenshots: blurScreenshotsOnCapture,
        onDataUrlsReady: ({ regular, blurred }) => {
          resolve({ regular, blurred });
        },
      });
    } else {
      // Currently used just for Monday's Canvas. See PR #1694
      if (takeScreenshotOfCanvasOnly) {
        try {
          const dataURL = document
            .getElementsByTagName('canvas')[0]
            .toDataURL();
          resolve({ regular: dataURL, blurred: undefined });
        } catch (e: unknown) {
          logger.logException('Unable to screenshot canvas', e);
          throw new Error(`Couldn't capture screenshot of canvas.`);
        }
      } else {
        const nativeScreenshotter = new NativeScreenshotter({
          sidebarVisible: sidebarVisible ?? false,
          logger,
          options: {
            includeBlurredVersion: blurScreenshotsOnCapture,
            screenshotConfig,
          },
        });

        void nativeScreenshotter.takeScreenshot().then((dataURIs) => {
          if (!dataURIs) {
            resolve(null);
          } else {
            resolve({
              regular: dataURIs.regular,
              blurred: dataURIs?.blurred,
            });
          }
        });
      }
    }
  });

  const [regularFile, blurredFile] = await Promise.all([
    createFileForUpload(screenshot),
    blurredScreenshot
      ? createFileForUpload(blurredScreenshot)
      : Promise.resolve(),
  ]);

  if (!regularFile) {
    return null;
  }

  const uploadScreenshot = async (
    screenshotDataURL: string,
    dummyScreenshot: NonNullable<Screenshot>,
    screenshotFile: FileForUpload,
  ) => {
    const screenshotBuffer = bufferFromDataURL(screenshotDataURL);
    if (
      validateFileForUpload('attachment', {
        name: dummyScreenshot.name,
        mimeType: dummyScreenshot.mimeType,
        size: screenshotBuffer.length,
      }).valid
    ) {
      await uploadFile({ ...screenshotFile, buffer: screenshotBuffer });
    }
  };

  const screenshotAndUpload = async () => {
    const screenshotURLs = await getScreenshotURL;

    if (!screenshotURLs) {
      return;
    }

    const promises = [
      uploadScreenshot(screenshotURLs.regular, screenshot, regularFile),
    ];

    if (screenshotURLs.blurred && blurredFile && blurredScreenshot) {
      promises.push(
        uploadScreenshot(
          screenshotURLs.blurred,
          blurredScreenshot,
          blurredFile,
        ),
      );
    }

    await Promise.all(promises);
  };

  // Do the screenshotting and uploading in the background
  void screenshotAndUpload();

  return {
    screenshotId: screenshot.id,
    blurredScreenshotId: blurredScreenshot?.id ?? null,
  };
}
