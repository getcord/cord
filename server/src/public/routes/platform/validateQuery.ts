import type { Request } from 'express';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import {
  getLocationFilter,
  getViewerThreadFilter,
  isLocation,
  isValidMetadata,
} from 'common/types/index.ts';
import type {
  FilterParameters,
  Location,
  LocationFilterOptions,
  TimestampRange,
  ViewerThreadStatus,
} from '@cord-sdk/types';
import { combine, isDefined } from 'common/util/index.ts';
import type { ThreadSortInput } from 'server/src/schema/operations.ts';
import {
  DEFAULT_THREAD_INITIAL_PAGE_SIZE,
  THREAD_INITIAL_PAGE_SIZE_LIMIT,
} from 'common/const/Api.ts';

type AcceptFilter = {
  [k in keyof Omit<FilterParameters, 'organizationID'>]-?: boolean;
};

type FilterReturn = Omit<
  FilterParameters,
  'location' | 'viewer' | 'organizationID'
> & {
  location?: LocationFilterOptions;
  viewer?: ViewerThreadStatus[];
};

export function validateFilter(
  query: Request['query'],
  accept: AcceptFilter,
): FilterReturn {
  const { filter } = query;
  const result: FilterReturn = {};
  if (filter) {
    let filterJson: FilterParameters = {};
    try {
      filterJson = JSON.parse(filter as string);
    } catch (e) {
      throw new ApiCallerError('invalid_field', {
        message: 'The filter object must be a valid JSON object.',
      });
    }
    if (typeof filterJson !== 'object') {
      throw new ApiCallerError('invalid_field', {
        message: 'The filter object must be a valid JSON object.',
      });
    }
    const {
      location,
      metadata,
      authorID,
      firstMessageTimestamp,
      mostRecentMessageTimestamp,
      groupID,
      organizationID,
      resolvedStatus,
      viewer,
      ...otherFilters
    } = filterJson;
    if (Object.keys(otherFilters).length > 0) {
      const someBadField = Object.keys(otherFilters)[0];
      throw new ApiCallerError('invalid_field', {
        message: `The filter object does not support "${someBadField}" as a field.`,
      });
    }
    if (location) {
      if (!accept.location) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "location" as a field.`,
        });
      }
      const parsedLocation = getLocationFilter(location);
      if (!parsedLocation) {
        throw new ApiCallerError('invalid_field', {
          message: `"location" must be valid JSON. See https://docs.cord.com/reference/location for more information.`,
        });
      }
      result['location'] = parsedLocation;
    }
    if (metadata) {
      if (!accept.metadata) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "metadata" as a field.`,
        });
      }
      if (!isValidMetadata(metadata)) {
        throw new ApiCallerError('invalid_field', {
          message: `"metadata" must be valid JSON.`,
        });
      }
      result['metadata'] = metadata;
    }
    if (firstMessageTimestamp) {
      if (!accept.firstMessageTimestamp) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "firstMessageTimestamp" as a field.`,
        });
      }
      const validatedTimestampRange = validateTimestampRange(
        firstMessageTimestamp,
        'firstMessageTimestamp',
      );
      result['firstMessageTimestamp'] = validatedTimestampRange;
    }

    if (mostRecentMessageTimestamp) {
      if (!accept.mostRecentMessageTimestamp) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "mostRecentMessageTimestamp" as a field.`,
        });
      }
      const validatedTimestampRange = validateTimestampRange(
        mostRecentMessageTimestamp,
        'mostRecentMessageTimestamp',
      );
      result['mostRecentMessageTimestamp'] = validatedTimestampRange;
    }
    if (organizationID) {
      if (typeof organizationID !== 'string') {
        throw new ApiCallerError('invalid_field', {
          message: `"groupID" is not valid`,
        });
      }

      result['groupID'] = organizationID; // note - returned as groupID
    }
    if (groupID) {
      if (typeof groupID !== 'string') {
        throw new ApiCallerError('invalid_field', {
          message: `"groupID" is not valid`,
        });
      }
      result['groupID'] = groupID;
    }
    if (authorID) {
      if (!accept.authorID) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "authorID" as a field.`,
        });
      }
      if (typeof authorID !== 'string') {
        throw new ApiCallerError('invalid_field', {
          message: `"authorID" is not valid.`,
        });
      }
      result['authorID'] = authorID;
    }
    if (resolvedStatus) {
      if (!accept.resolvedStatus) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "resolvedStatus" as a field.`,
        });
      }
      if (typeof resolvedStatus !== 'string') {
        throw new ApiCallerError('invalid_field', {
          message: `"resolvedStatus" must be set to "any", "resolved", or "unresolved"`,
        });
      }
      if (
        resolvedStatus !== 'any' &&
        resolvedStatus !== 'resolved' &&
        resolvedStatus !== 'unresolved'
      ) {
        throw new ApiCallerError('invalid_field', {
          message: `"resolvedStatus" must be set to "any", "resolved", or "unresolved"`,
        });
      }
      result['resolvedStatus'] = resolvedStatus;
    }
    if (viewer) {
      if (!accept.viewer) {
        throw new ApiCallerError('invalid_field', {
          message: `The filter object does not support "viewer" as a field.`,
        });
      }
      if (typeof viewer !== 'string' && !Array.isArray(viewer)) {
        throw new ApiCallerError('invalid_field', {
          message: `"viewer" must be one or more of "subscribed" or "mentioned"`,
        });
      }
      const parsedViewer = getViewerThreadFilter(viewer);
      if (parsedViewer.some((v) => v !== 'subscribed' && v !== 'mentioned')) {
        throw new ApiCallerError('invalid_field', {
          message: `"viewer" must be one or more of "subscribed" or "mentioned"`,
        });
      }
      result['viewer'] = parsedViewer;
    }
  }
  return result;
}

function validateTimestampRange(obj: any, field: string) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be valid JSON object.`,
    });
  }
  const { from, to, ...otherFields } = obj;
  const timerangeFields = ['from', 'to'];
  if (Object.keys(otherFields).length > 0) {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" object must only contain the fields: ${combine(
        'and',
        timerangeFields,
      )}}`,
    });
  }
  if (from === undefined && to === undefined) {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" object must contain at least one of the ${
        timerangeFields.length
      } optional fields: ${combine('or', timerangeFields)}`,
    });
  }

  const validatedObject: TimestampRange = {};
  for (const [property, value] of Object.entries(obj)) {
    // check if value is type Date
    if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
      throw new ApiCallerError('invalid_field', {
        message: `"${property}" value on "${field}" must be a valid date`,
      });
    }

    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime())) {
      validatedObject[property as keyof TimestampRange] = dateValue;
    } else {
      throw new ApiCallerError('invalid_field', {
        message: `"${property}" value on "${field}" must be a valid date`,
      });
    }
  }
  return validatedObject;
}

export function validatePaginationToken({
  token,
  endpoint,
}: {
  token: any;
  endpoint: string;
}) {
  if (!token) {
    return;
  }
  if (typeof token !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: `Pagination token should be of type string.`,
    });
  }
  let decodedToken;

  try {
    decodedToken = token && JSON.parse(atob(token));
  } catch (error) {
    throw new ApiCallerError('invalid_field', {
      message: `Pagination token is not valid`,
    });
  }

  if (
    !decodedToken ||
    !decodedToken.externalID ||
    decodedToken.externalID.length === 0 ||
    (endpoint === 'messages' &&
      (!decodedToken.createdAtWithMicros ||
        decodedToken.createdAtWithMicros.length === 0)) ||
    (endpoint === 'threads' &&
      (!decodedToken.nextCursorTimestamp ||
        decodedToken.nextCursorTimestamp.length === 0)) ||
    (endpoint === 'org-members' &&
      (!decodedToken.userID || decodedToken.userID.length === 0))
  ) {
    throw new ApiCallerError('invalid_field', {
      message: `Pagination token is not valid`,
    });
  }

  return decodedToken;
}

export function validateSort(query: Request['query']): ThreadSortInput {
  const result: ThreadSortInput = {
    sortBy: 'first_message_timestamp',
    sortDirection: 'descending',
  };
  if (query.sortBy) {
    if (
      query.sortBy !== 'first_message_timestamp' &&
      query.sortBy !== 'most_recent_message_timestamp'
    ) {
      throw new ApiCallerError('invalid_field', {
        message: `"sortBy" must be set to "first_message_timestamp" or "most_recent_message_timestamp"`,
      });
    }
    result.sortBy = query.sortBy;
  }
  if (query.sortDirection) {
    if (
      query.sortDirection !== 'ascending' &&
      query.sortDirection !== 'descending'
    ) {
      throw new ApiCallerError('invalid_field', {
        message: `"sortDirection" must be set to "ascending" or "descending"`,
      });
    }
    result.sortDirection = query.sortDirection;
  }
  return result;
}

export function validateInitialFetchCount(query: Request['query']): number {
  if (query.initialFetchCount) {
    if (typeof query.initialFetchCount !== 'string') {
      throw new ApiCallerError('invalid_field', {
        message: `"initialFetchCount" must be a number`,
      });
    }
    const amt = parseInt(query.initialFetchCount, 10);
    if (Number.isNaN(amt)) {
      throw new ApiCallerError('invalid_field', {
        message: `"initialFetchCount" must be a number`,
      });
    }
    return Math.min(amt, THREAD_INITIAL_PAGE_SIZE_LIMIT);
  }
  return DEFAULT_THREAD_INITIAL_PAGE_SIZE;
}

export function validateBooleanValue<T>(
  query: Request['query'],
  field: string,
  def: T,
): boolean | T {
  let value = query[field];
  if (!isDefined(value)) {
    return def;
  }
  if (typeof value !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be a boolean`,
    });
  }
  value = value.toLowerCase();
  if (value !== 'true' && value !== 'false') {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be a boolean`,
    });
  }
  return value === 'true';
}

export function validateLocationValue(
  query: Request['query'],
  field: string,
): Location | undefined {
  const value = query[field];
  if (!isDefined(value)) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be a location`,
    });
  }
  let decoded = {};
  try {
    decoded = JSON.parse(value);
  } catch (e) {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be a location`,
    });
  }
  if (!isLocation(decoded)) {
    throw new ApiCallerError('invalid_field', {
      message: `"${field}" must be a location`,
    });
  }
  return decoded;
}

export function validateLimit(limit: unknown, defaultLimit: number): number {
  if (!limit) {
    return defaultLimit;
  }

  if (typeof limit !== 'string') {
    throw new ApiCallerError('invalid_field', {
      message: `Limit must be a number.`,
    });
  }

  const parsedLimit = Number.parseInt(limit);
  if (isNaN(parsedLimit)) {
    throw new ApiCallerError('invalid_field', {
      message: `Limit must be a number.`,
    });
  }

  return parsedLimit;
}
