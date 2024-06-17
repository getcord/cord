import { nanoid } from 'nanoid';

import type { WorkerEventData } from 'external/src/lib/nativeScreenshot/worker/index.ts';
import NativeScreenshot from 'external/src/lib/nativeScreenshot/worker/NativeScreenshot.ts';

export function fetchCssWithFontsEmbeddedUsingWorker(
  url: string,
): Promise<{ cssStrings: string[] } | null> {
  const id = nanoid();

  return new Promise((resolve) => {
    const ScreenshotWorker = NativeScreenshot.getWorker();
    const listener = (
      event: MessageEvent<{
        id: string;
        result: { cssStrings: string[] } | null;
      }>,
    ) => {
      if (event.data.id === id) {
        ScreenshotWorker?.removeEventListener('message', listener);
        resolve(event.data.result);
      }
    };

    ScreenshotWorker?.addEventListener('message', listener);
    const message: WorkerEventData['fetchCssWithFontsEmbedded'] = {
      type: 'fetchCssWithFontsEmbedded',
      id,
      url,
    };
    ScreenshotWorker?.postMessage(message);
  });
}
