declare const workerCode: string;

let ScreenshotWorker: Worker | undefined;
let canUseWorker = true;
const NativeScreenshot = {
  setWorker: (worker: Worker) => (ScreenshotWorker = worker),
  getWorker: () => {
    if (ScreenshotWorker) {
      return ScreenshotWorker;
    }

    try {
      if (!canUseWorker) {
        return undefined;
      }

      const workerURL = URL.createObjectURL(
        new Blob([atob(workerCode)], {
          type: 'text/javascript',
        }),
      );
      ScreenshotWorker = new Worker(workerURL);
      return ScreenshotWorker;
    } catch (e) {
      console.error('[CORD] Failed to initialise Web Worker.', e);
      // TODO: logWarning? We should alert the client that whitelisting
      // our web worker URL speeds up the screenshot process.
      canUseWorker = false;
      return undefined;
    }
  },
};
Object.freeze(NativeScreenshot);

export default NativeScreenshot;
