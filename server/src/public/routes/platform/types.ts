import { isValidExternalID } from 'common/util/externalIDs.ts';
import type { ClientAuthTokenData } from '@cord-sdk/types';
import {
  createInvalidInputTypeMessage,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';

export function validateExternalID(id: string | number, fieldName: string) {
  if (!isValidExternalID(id)) {
    throw new ApiCallerError('invalid_field', {
      message: createInvalidInputTypeMessage(fieldName, 'identifier'),
    });
  }
}

/**
 * Same items within ClientAuthTokenData but user_id and group_id are type
 * string, app_id is required, and the organization_* fields have been removed (will be moved into
 * group_* if present)
 */
export type InternalClientAuthTokenData = Omit<
  ClientAuthTokenData,
  'user_id' | 'organization_id' | 'group_id' | 'organization_details' | 'app_id'
> & {
  user_id: string;
  group_id?: string;
  app_id: string;
};
