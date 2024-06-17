import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import type { SuccessResult } from 'server/src/schema/resolverTypes.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';

export function sendErrors<Args extends unknown[]>(
  func: (...args: Args) => SuccessResult | Promise<SuccessResult>,
) {
  return async (...args: Args) => {
    try {
      return await func(...args);
    } catch (error) {
      if (
        error instanceof ApiCallerError ||
        error instanceof ClientFacingError
      ) {
        return {
          success: false,
          failureDetails: {
            code: error.name,
            message: error.message,
          },
        };
      }
      throw error;
    }
  };
}
