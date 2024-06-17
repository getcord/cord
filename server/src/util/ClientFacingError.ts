import type { JsonObject } from 'common/types/index.ts';
import type { LoggingTags } from 'server/src/logging/Logger.ts';
import { CordError } from 'server/src/util/CordError.ts';

/**
 * Most errors encountered during GraphQL requests are logged but are returned
 * to the user as "generic GraphQL error". If you instead throw a
 * ClientFacingError, the exact error text will be reported to them instead.
 */
export class ClientFacingError extends CordError {
  message: string;

  constructor(
    message: string,
    loggingMetadata?: JsonObject,
    loggingTags?: LoggingTags,
  ) {
    super(message, loggingMetadata, loggingTags);
    this.message = message;
  }
}
