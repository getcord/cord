import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import type { Options } from 'external/src/lib/nativeScreenshot/options.ts';

export type CloneConfig = {
  options: Options;
  containingWindow: Window;
  containingDocument: Document;
  logger: BasicLogger;
};

export class BaseCloner {
  options: Options;
  containingWindow: Window;
  containingDocument: Document;
  logger: BasicLogger;

  constructor({
    options = {},
    containingWindow,
    containingDocument,
    logger,
  }: CloneConfig) {
    this.options = options;
    this.containingWindow = containingWindow;
    this.containingDocument = containingDocument;
    this.logger = logger;
  }
}
