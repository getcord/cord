import isJWT from 'validator/lib/isJWT.js';
import type { Transaction, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

import { verify } from 'jsonwebtoken';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import env from 'server/src/config/Env.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { EntityMetadata, JsonObject, UUID } from 'common/types/index.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { combine } from 'common/util/index.ts';
import type { LoggingTags } from 'server/src/logging/Logger.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { CordError } from 'server/src/util/CordError.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

const ApiErrors = {
  // Database queries
  project_not_found: {
    statusCode: 401,
    message: 'Platform project not found.',
  },
  group_not_found: {
    statusCode: 401,
    message: 'Platform group not found.',
  },
  organization_not_found: {
    statusCode: 401,
    message: 'Platform organization not found.',
  },
  group_already_exists: {
    statusCode: 409,
    message: 'Platform group already exists.',
  },
  organization_already_exists: {
    statusCode: 409,
    message: 'Platform organization already exists.',
  },
  user_not_found: {
    statusCode: 401,
    message: 'Platform user not found.',
  },
  user_already_exists: {
    statusCode: 409,
    message: 'Platform user already exists.',
  },
  user_not_in_group: {
    statusCode: 401,
    message: 'The user is not a member of the group.',
  },
  user_not_in_organization: {
    statusCode: 401,
    message: 'The user is not a member of the oranization.',
  },
  invalid_user_id: {
    statusCode: 401,
    message: 'Invalid user id',
  },
  group_members_missing: {
    statusCode: 401,
    message: 'Could not find some group members',
  },

  // Request input
  invalid_request: {
    statusCode: 400,
    message: 'Invalid request.',
  },
  unexpected_field: {
    statusCode: 400,
    message: 'Unexpected field.',
  },
  invalid_field: {
    statusCode: 400,
    message: 'Invalid field type.',
  },
  missing_field: {
    statusCode: 400,
    message: 'Missing field in request.',
  },
  // Authorization
  invalid_project_token: {
    statusCode: 401,
    message: 'Invalid project token.',
  },
  invalid_customer_token: {
    statusCode: 401,
    message: 'Invalid customer token.',
  },
  expired_access_token: {
    statusCode: 401,
    message: 'Access token has expired.',
  },
  invalid_access_token: {
    statusCode: 401,
    message: 'Invalid access token.',
  },
  invalid_authorization_header: {
    statusCode: 401,
    message: 'Invalid authorization header.',
  },
  invalid_session_token: {
    statusCode: 401,
    message: 'Invalid session token.',
  },
  missing_authorization_header: {
    statusCode: 401,
    message: 'Missing authorization header.',
  },
  // Only used when a console user has logged in with auth0 using a different
  // type of connection. We match this in AuthErrorPage.tsx
  invalid_console_user: {
    statusCode: 401,
    message: 'User has logged in with different connection type.',
  },

  // Thread
  thread_already_exists: {
    statusCode: 409,
    message: 'Thread already exists.',
  },
  thread_not_found: {
    statusCode: 404,
    message: 'Thread not found.',
  },

  // Sharing Threads
  invalid_email: {
    statusCode: 400,
    message: 'Invalid email address.',
  },
  group_not_connected_to_slack: {
    statusCode: 400,
    message: 'Group not connected to a Slack Workspace.',
  },
  slack_credentials_not_found: {
    statusCode: 404,
    message: 'Could not retrieve slack bot credentials',
  },
  slack_channel_not_found: {
    statusCode: 404,
    message: 'Cannot load slack channel',
  },
  thread_already_shared: {
    statusCode: 400,
    message: 'Thread already shared to slack channel.',
  },

  // Message
  message_already_exists: {
    statusCode: 409,
    message: 'Message already exists.',
  },
  message_not_found: {
    statusCode: 404,
    message: 'Message not found.',
  },
  message_edit_forbidden: {
    statusCode: 403,
    message: 'This user cannot edit this message.',
  },
  message_not_appendable: {
    statusCode: 400,
    message:
      'The request references a message that can not support appending. It must contain a markdown node only.',
  },

  // Notification
  notification_not_found: {
    statusCode: 404,
    message: 'Notification not found.',
  },

  // Files
  file_not_found: {
    statusCode: 404,
    message: 'File not found.',
  },
  file_belongs_to_different_user: {
    statusCode: 403,
    message: 'Cannot attach files owned by another user',
  },
  file_too_large: {
    statusCode: 413,
    message: 'Maximum file size exceeded',
  },
  file_name_not_allowed: {
    statusCode: 400,
    message: 'File name is not allowed',
  },
  file_type_not_allowed: {
    statusCode: 400,
    message: 'File MIME type is not allowed',
  },

  //Webhook
  webhook_url_not_verified: {
    statusCode: 400,
    message: 'Cannot verify event webhook URL.',
  },
};

export type PlatformErrorNameType = keyof typeof ApiErrors;

export class ApiCallerError extends CordError {
  statusCode: number;

  constructor(
    errorName: PlatformErrorNameType,
    { message, code }: { message?: string; code?: number } = {},
    loggingMetadata?: JsonObject,
    loggingTags?: LoggingTags,
  ) {
    const app_id = (loggingMetadata?.app_id ?? 'unknown') as string;
    super(message, loggingMetadata, {
      ...loggingTags,
      api_caller_error: true,
      app_id: app_id,
    });
    this.name = errorName;
    this.message = this.message || ApiErrors[errorName].message;
    this.statusCode = code || ApiErrors[errorName].statusCode;
  }
}

function createMissingFieldsMessage(missingFields: string[]) {
  return `Missing ${generateFieldsListString(missingFields, 'required')}`;
}

export function createInvalidRequestMessage(
  requiredFields?: readonly string[],
  optionalFields?: readonly string[],
) {
  const numberOfRequiredFields = requiredFields ? requiredFields.length : 0;

  const expectedMessage =
    requiredFields && requiredFields.length > 0
      ? `${numberOfRequiredFields} ${generateFieldsListString(
          requiredFields,
          'required',
        )}`
      : '';

  const optionalFieldsMessage =
    optionalFields && optionalFields.length > 0
      ? `${optionalFields.length} ${generateFieldsListString(
          optionalFields,
          'optional',
        )}`
      : '';

  // Outputs something like 'Expected 3 required fields: name, email and address. 2 optional fields: age and colour'

  return ['Expected', expectedMessage, optionalFieldsMessage]
    .filter((s) => s.length > 0)
    .join(' ');
}

function createUnexpectedFieldMessage(
  invalidFieldName: string,
  requiredFields: string[],
  optionalFields?: string[],
) {
  const expectedMessage =
    requiredFields && requiredFields.length > 0
      ? `${requiredFields.length} ${generateFieldsListString(
          requiredFields,
          'required',
        )}`
      : '';

  const optionalFieldsMessage =
    optionalFields && optionalFields.length > 0
      ? `${optionalFields.length} ${generateFieldsListString(
          optionalFields,
          'optional',
        )}`
      : '';

  return `${invalidFieldName} is not a valid field name for this request. Expected ${[
    expectedMessage,
    optionalFieldsMessage,
  ]
    .filter((s) => s.length > 0)
    .join(' ')}`;
}

export function createInvalidInputTypeMessage(
  fieldName: string,
  expectedInputType: string,
) {
  return `Input type for ${fieldName} is not valid, expected ${expectedInputType}.`;
}

// Outputs a list depending on how many elements are in the array and if the
// fields are received, required or optional.
function generateFieldsListString(
  fields: readonly string[],
  fieldsType?: 'required' | 'optional',
) {
  let fieldsString = '';
  if (fields.length === 0) {
    return ' fields.';
  }
  if (fields.length === 1) {
    fieldsString = `${fieldsType ?? ''} field: ${fields[0]}.`;
  }
  if (fields.length > 1) {
    fieldsString = `${fieldsType ?? ''} fields: ${fields
      .slice(0, -1)
      .join(', ')} and ${fields.slice(-1).join('')}.`;
  }
  return fieldsString;
}

/*
  The validateInput function validates that the request data we receive in an API route
  conforms to the expected structure (required + optional fields, valid field values).
  When you call this function you can supply either required, optional or both. Each of these
  objects' keys should be the expected field names, and the values must be validation functions
  which will be invoked with the value of each respective field.
  The validation function must return either true if the value for that field is valid,
  or a string in case of an error, representing in plain language the expected type of that field,
  for example "number" or "a list of strings". This string will be part of the validation error
  message returned by the API, for example returning "string" will result in this error message:
  "Input type for first_name is not valid, expected string"
*/

type ValidationFunction = (value: any) => true | string;
type InputFields = { [fieldName: string]: ValidationFunction };

export function validateInput<T>(
  input: any,
  {
    required = {},
    optional = {},
  }: {
    required?: InputFields;
    optional?: InputFields;
  },
): T {
  if (typeof input !== 'object') {
    throw new ApiCallerError('invalid_request');
  }

  const receivedFields = Object.keys(input);
  const requiredFields = Object.keys(required);
  const optionalFields = Object.keys(optional);

  const missingRequiredFields = requiredFields.filter(
    (field) => input[field] === undefined,
  );
  if (missingRequiredFields.length > 0) {
    throw new ApiCallerError('missing_field', {
      message: createMissingFieldsMessage(missingRequiredFields),
    });
  }

  for (const key of receivedFields) {
    if (!requiredFields.includes(key) && !optionalFields.includes(key)) {
      throw new ApiCallerError('unexpected_field', {
        message: createUnexpectedFieldMessage(
          key,
          requiredFields,
          optionalFields,
        ),
      });
    }

    const validationFunction = required[key] || optional[key];
    const validationResult = validationFunction(input[key]);
    if (validationResult !== true) {
      throw new ApiCallerError('invalid_field', {
        message: createInvalidInputTypeMessage(key, validationResult),
      });
    }
  }

  return input;
}

export function forwardHandlerExceptionsToNext(
  handler: (req: Request, res: Response, next: NextFunction) => unknown,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        await handler(req, res, next);
      } catch (e) {
        next(e);
      }
    })();
  };
}

export function isCordSignedToken(accessToken: string) {
  try {
    verify(accessToken, env.JWT_SIGNING_SECRET, {
      algorithms: ['HS512'],
    });
  } catch (err) {
    return false;
  }
  return true;
}

export function verifyBearerTokenInAuthorizationHeaders(
  header: string | undefined,
) {
  if (!header) {
    throw new ApiCallerError('missing_authorization_header', {
      message: 'Authorization header bearer token must be present.',
    });
  }

  if (header.indexOf('Bearer') !== 0) {
    throw new ApiCallerError('invalid_authorization_header', {
      message: 'Expecting a token with a Bearer prefix.',
    });
  }
  const token = header.replace('Bearer ', '').trim();

  if (!isJWT.default(token)) {
    throw new ApiCallerError('invalid_authorization_header', {
      message: createInvalidInputTypeMessage(
        'authorization header bearer token',
        'JWT',
      ),
    });
  }

  return token;
}

export async function createPlatformOrganization(
  platformApplicationID: UUID,
  externalID: string,
  name: string,
  status: string | undefined,
  metadata: EntityMetadata | undefined,
  transaction?: Transaction,
) {
  return await OrgEntity.create(
    {
      name,
      externalProvider: AuthProviderType.PLATFORM,
      externalID,
      state: status === 'deleted' ? 'inactive' : 'active',
      metadata,
      platformApplicationID,
    },
    { transaction },
  );
}

export async function findOrCreatePlatformOrganization(
  platformApplicationID: UUID,
  externalID: string,
  name: string,
  status: string | undefined,
) {
  return await OrgEntity.findOrCreate({
    where: { platformApplicationID, externalID, name, state: status },
    defaults: {
      name,
      externalProvider: AuthProviderType.PLATFORM,
      externalID,
      state: status === 'deleted' ? 'inactive' : 'active',
      platformApplicationID,
    },
  });
}

export async function findOrCreatePlatformApplication(
  id: UUID,
  name: string,
  environment: string,
  customerID: UUID,
  eventWebhookURL: string,
  eventWebhookSubscriptions: string[],
  sharedSecret: string,
) {
  return await ApplicationEntity.findOrCreate({
    where: { id },
    defaults: {
      name,
      environment,
      customerID,
      eventWebhookURL,
      eventWebhookSubscriptions,
      sharedSecret,
    },
  });
}

export async function createPlatformUser(
  context: RequestContext | null,
  platformApplicationID: UUID,
  externalID: string,
  email: string | undefined | null,
  name: string | undefined | null,
  short_name: string | undefined | null,
  profile_picture_url: string | null | undefined,
  status: string | undefined,
  metadata: EntityMetadata | null | undefined,
  tx?: Transaction | null | undefined,
) {
  if (tx) {
    return await doCreatePlatformUser(
      context,
      platformApplicationID,
      externalID,
      email,
      name,
      short_name,
      profile_picture_url,
      status,
      metadata,
      tx,
    );
  } else {
    return await getSequelize().transaction(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      async (tx) =>
        await doCreatePlatformUser(
          context,
          platformApplicationID,
          externalID,
          email,
          name,
          short_name,
          profile_picture_url,
          status,
          metadata,
          tx,
        ),
    );
  }
}

async function doCreatePlatformUser(
  context: RequestContext | null,
  platformApplicationID: UUID,
  externalID: string,
  email: string | undefined | null,
  name: string | undefined | null,
  screen_name: string | undefined | null,
  profile_picture_url: string | null | undefined,
  status: string | undefined,
  metadata: EntityMetadata | null | undefined,
  tx: Transaction,
) {
  const [user, isNewUser] = await new UserMutator(
    Viewer.createServiceViewer(),
    context?.loaders ?? null,
  ).findOrCreateExternalUser(
    {
      name: name ?? null,
      screenName: screen_name ?? null,
      email: email ?? null,
      profilePictureURL: profile_picture_url ?? null,
      externalID,
      platformApplicationID,
      state: status,
      metadata: metadata ?? {},
      externalProvider: AuthProviderType.PLATFORM,
    },
    tx,
  );

  if (!isNewUser) {
    throw new ApiCallerError('user_already_exists', {
      message: `The platform user with id ${user.externalID} already exists, to update user please make a PUT request to users/<USER_ID>.`,
    });
  }

  return user;
}

export async function updatePlatformOrganizationMembers(
  org: OrgEntity,
  members: (string | number)[],
  transaction?: Transaction,
) {
  const newMembers = members.map((member) => member.toString());
  const userMap = new Map(
    (
      await UserEntity.findAll({
        where: {
          externalID: newMembers,
          platformApplicationID: org.platformApplicationID,
          externalProvider: AuthProviderType.PLATFORM,
        },
        transaction,
      })
    ).map((user) => [user.externalID, user]),
  );
  if (newMembers.length !== userMap.size) {
    const missingMembers = new Set<string>();
    newMembers.map((member) => {
      if (!userMap.has(member)) {
        missingMembers.add(member);
      }
    });
    throw new ApiCallerError('user_not_found', {
      message: `Platform ${
        missingMembers.size > 1 ? 'users' : 'user'
      } ${combine('and', [...missingMembers])} not found.`,
    });
  }

  const orgMemberships = new Set(
    (
      await OrgMembersEntity.findAll({
        where: {
          orgID: org.id,
        },
        transaction,
      })
    ).map((om) => om.userID),
  );
  const addedMembers = new Set<UUID>();

  await OrgMembersEntity.bulkCreate(
    newMembers
      .filter((member) => {
        const user = userMap.get(member)!;
        return !orgMemberships.has(user.id);
      })
      .map((member) => {
        const user = userMap.get(member)!;
        addedMembers.add(user.id);
        return {
          userID: user.id,
          orgID: org.id,
        };
      }),
    { ignoreDuplicates: true, transaction },
  );

  // Capture the ids of the ones we are about to delete
  const userToDeleteWhere: WhereOptions<OrgMembersEntity> = {
    orgID: org.id,
    userID: { [Op.notIn]: [...userMap.values()].map((user) => user.id) },
  };
  const deleted = await OrgMembersEntity.findAll({
    where: userToDeleteWhere,
    transaction,
  });

  await OrgMembersEntity.destroy({
    where: userToDeleteWhere,
    transaction,
  });

  const deletedMembersIds = deleted.map((om) => om.userID);

  return { added: [...addedMembers], deleted: deletedMembersIds };
}

/**
 * Create a new user. Can also add it to an org if you pass `orgID`.
 */
export async function createDummyPlatformUser({
  applicationID,
  orgID,
  firstName,
  profilePicture,
  transaction,
  externalID,
  email,
  dummy,
}: {
  applicationID: UUID;
  orgID?: UUID;
  firstName?: string;
  profilePicture?: string;
  transaction?: Transaction;
  externalID?: string;
  email?: string;
  dummy?: boolean;
}) {
  const newUser = await createPlatformUser(
    null,
    applicationID,
    externalID ?? uuid(), // ExternalID
    email,
    firstName, // Name
    undefined, // Screen name
    profilePicture,
    'active',
    { dummy: dummy ?? true },
    transaction,
  );

  if (orgID) {
    await OrgMembersEntity.upsert(
      {
        userID: newUser.id,
        orgID: orgID,
      },
      { transaction },
    );
  }

  return newUser;
}
