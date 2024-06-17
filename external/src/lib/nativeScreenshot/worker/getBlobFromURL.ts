import { nanoid } from 'nanoid';

import type { WorkerEventData } from 'external/src/lib/nativeScreenshot/worker/index.ts';
import NativeScreenshot from 'external/src/lib/nativeScreenshot/worker/NativeScreenshot.ts';

export function getBlobFromURLUsingWorker(
  url: string,
  imagePlaceholder?: string | undefined,
): Promise<{ blob: string; contentType: string } | null> {
  const id = nanoid();

  return new Promise((resolve) => {
    const ScreenshotWorker = NativeScreenshot.getWorker();
    const listener = (
      event: MessageEvent<{
        id: string;
        result: { blob: string; contentType: string } | null;
      }>,
    ) => {
      if (event.data.id === id) {
        ScreenshotWorker?.removeEventListener('message', listener);
        resolve(event.data.result);
      }
    };

    ScreenshotWorker?.addEventListener('message', listener);
    const message: WorkerEventData['getBlobFromURL'] = {
      type: 'getBlobFromURL',
      id,
      url,
      imagePlaceholder,
    };
    ScreenshotWorker?.postMessage(message);
  });
}
