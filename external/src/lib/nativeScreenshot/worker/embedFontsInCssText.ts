import { nanoid } from 'nanoid';

import type { WorkerEventData } from 'external/src/lib/nativeScreenshot/worker/index.ts';
import NativeScreenshot from 'external/src/lib/nativeScreenshot/worker/NativeScreenshot.ts';

export function embedFontsInCssTextUsingWorker(
  stylesheetUrl: string,
  cssText: string,
): Promise<string> {
  const id = nanoid();

  return new Promise((resolve) => {
    const ScreenshotWorker = NativeScreenshot.getWorker();
    const listener = (
      event: MessageEvent<{
        id: string;
        result: string;
      }>,
    ) => {
      if (event.data.id === id) {
        ScreenshotWorker?.removeEventListener('message', listener);
        resolve(event.data.result);
      }
    };

    ScreenshotWorker?.addEventListener('message', listener);
    const message: WorkerEventData['embedFontsInCssText'] = {
      type: 'embedFontsInCssText',
      id,
      stylesheetUrl,
      cssText,
    };
    ScreenshotWorker?.postMessage(message);
  });
}
