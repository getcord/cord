import type { ValidationResult } from 'common/uploads/index.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export function assertValid(result: ValidationResult) {
  // This should match the logic in common/uploads/index.ts, but it throws
  // ApiCallerError
  if (!result.name) {
    throw new ApiCallerError('file_name_not_allowed', {
      message: `Cannot upload file named ${result.input.name}`,
    });
  }
  if (!result.size) {
    throw new ApiCallerError('file_too_large');
  }
  if (!result.mimeType) {
    throw new ApiCallerError('file_type_not_allowed', {
      message: `Input ${result.input.mimeType} MIME type is not allowed`,
    });
  }
}
