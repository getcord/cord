// https://dev.to/trezy/loading-images-with-web-workers-49ap

import { getBlobFromURL } from 'external/src/lib/nativeScreenshot/util/getBlobFromURL.ts';
import { fetchCssWithFontsEmbedded } from 'external/src/lib/nativeScreenshot/util/fetchCssWithFontsEmbedded.ts';
import { embedFontsInCssText } from 'external/src/lib/nativeScreenshot/util/embedFontsInCssText.ts';

const context: Worker = self as any;

type GetBlobFromURLEventData = {
  id: string;
  type: 'getBlobFromURL';
  url: string;
  imagePlaceholder: string | undefined;
};

type FetchCssWithFontsEmbeddedEventData = {
  id: string;
  type: 'fetchCssWithFontsEmbedded';
  url: string;
};
type EmbedFontsInCssTextEventData = {
  id: string;
  type: 'embedFontsInCssText';
  stylesheetUrl: string;
  cssText: string;
};

export type WorkerEventData = {
  getBlobFromURL: GetBlobFromURLEventData;
  fetchCssWithFontsEmbedded: FetchCssWithFontsEmbeddedEventData;
  embedFontsInCssText: EmbedFontsInCssTextEventData;
};

type EventData =
  | GetBlobFromURLEventData
  | FetchCssWithFontsEmbeddedEventData
  | EmbedFontsInCssTextEventData;

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
context.addEventListener('message', async (event: MessageEvent<EventData>) => {
  switch (event.data.type) {
    case 'getBlobFromURL': {
      context.postMessage({
        id: event.data.id,
        result: await getBlobFromURL(
          event.data.url,
          event.data.imagePlaceholder,
        ),
      });
      break;
    }
    case 'fetchCssWithFontsEmbedded': {
      context.postMessage({
        id: event.data.id,
        result: await fetchCssWithFontsEmbedded(event.data.url),
      });
      break;
    }
    case 'embedFontsInCssText':
      context.postMessage({
        id: event.data.id,
        result: await embedFontsInCssText(
          event.data.stylesheetUrl,
          event.data.cssText,
        ),
      });
      break;
  }
});
