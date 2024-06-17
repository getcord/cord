import type { Request, Response } from 'express';
import {
  createPlatformUser,
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

function validateCreateUserInput(data: unknown) {
  const validatedInput = validate.CreatePlatformUserVariables(data);
  validateExternalID(validatedInput.id, 'id');
  return validatedInput;
}

async function createUserHandler(req: Request, res: Response) {
  // assumes there is middle ware for handling the validation of the access token,
  // if its validated, the app ID will be passed forward

  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }
  deprecated('api: POST /v1/users', platformApplicationID);

  const {
    id: externalID, // Can be type string or number
    name,
    short_name,
    shortName,
    email,
    status,
    profile_picture_url,
    profilePictureURL,
    metadata,
    first_name,
    last_name,
    ...rest
  } = validateCreateUserInput(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  if (short_name) {
    deprecated(
      'snake:CreatePlatformUserHandler:short_name',
      platformApplicationID,
    );
  }

  if (profile_picture_url) {
    deprecated(
      'snake:CreatePlatformUserHandler:profile_picture_url',
      platformApplicationID,
    );
  }

  if (first_name) {
    deprecated('CreatePlatformUserHandler:first_name', platformApplicationID);
  }
  if (last_name) {
    deprecated('CreatePlatformUserHandler:last_name', platformApplicationID);
  }

  const newUser = await createPlatformUser(
    null,
    platformApplicationID,
    externalID.toString(), // Incase it is a number
    email,
    name,
    shortName ?? short_name,
    profilePictureURL ?? profile_picture_url,
    status,
    metadata,
  );

  res.status(201).json({
    success: true,
    message: `✅ You successfully created user ${newUser.externalID}`,
  });
}

export default forwardHandlerExceptionsToNext(createUserHandler);
