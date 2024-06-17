import type { CloneConfig } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import type { DocumentCloner } from 'external/src/lib/nativeScreenshot/DocumentCloner.ts';

export type ScreenshotUrls = {
  regular: string | null;
  blurred?: string | null;
};

export type CreateDocumentClonerFn = (config: CloneConfig) => DocumentCloner;
