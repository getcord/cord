import { useCallback } from 'react';
import { useFileUploader } from 'external/src/effects/useFileUploader.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import type { ScreenshotConfig } from '@cord-sdk/types';
import { captureScreenshot } from 'external/src/lib/screenshot.ts';

export function useCaptureScreenshot({
  sidebarVisible,
  blurScreenshotsOnCapture,
  screenshotConfig,
}: {
  sidebarVisible: boolean;
  blurScreenshotsOnCapture: boolean;
  screenshotConfig: ScreenshotConfig;
}) {
  const logger = useLogger();
  const { createFileForUpload, uploadFile } = useFileUploader();

  const takeScreenshotOfCanvasOnly = useFeatureFlag(
    FeatureFlags.TAKE_SCREENSHOT_OF_CANVAS_ONLY,
  );

  const captureScreenshotFunction = useCallback(async () => {
    return await captureScreenshot({
      logger,
      sidebarVisible,
      blurScreenshotsOnCapture,
      screenshotConfig,
      takeScreenshotOfCanvasOnly,
      createFileForUpload,
      uploadFile,
    });
  }, [
    blurScreenshotsOnCapture,
    createFileForUpload,
    logger,
    screenshotConfig,
    sidebarVisible,
    takeScreenshotOfCanvasOnly,
    uploadFile,
  ]);

  return captureScreenshotFunction;
}
