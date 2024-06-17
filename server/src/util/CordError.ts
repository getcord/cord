import type { JsonObject } from 'common/types/index.ts';
import type { LoggingTags } from 'server/src/logging/Logger.ts';

// Extending Error type solution taken from here:
// https://stackoverflow.com/questions/41102060/typescript-extending-error-class
export class CordError extends Error {
  constructor(
    message?: string,
    public loggingMetadata?: JsonObject,
    public loggingTags?: LoggingTags,
  ) {
    // 'Error' breaks prototype chain here
    super(message);

    // restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
