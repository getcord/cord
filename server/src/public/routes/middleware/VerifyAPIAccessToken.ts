import type { NextFunction, Request, Response } from 'express';
import { decode, TokenExpiredError, verify } from 'jsonwebtoken';
import isUUID from 'validator/lib/isUUID.js';
import type {
  APICordTokenData,
  CustomerServerAuthTokenData,
  AppServerAuthTokenData,
} from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import {
  createInvalidInputTypeMessage,
  isCordSignedToken,
  ApiCallerError,
  verifyBearerTokenInAuthorizationHeaders,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import {
  ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from 'common/const/Timing.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { asyncLocalStorage } from 'server/src/logging/performance.ts';

function validateCordTokenData(data: any): APICordTokenData {
  if (!(data instanceof Object)) {
    throw createInvalidInputTypeMessage('access token payload', 'object');
  }

  const { session_id } = data;

  if (!session_id) {
    throw 'Access token payload is missing session_id.';
  }

  if (!isUUID.default(session_id)) {
    throw createInvalidInputTypeMessage('session_id', 'UUID');
  }

  return { session_id };
}

async function verifyCordBearerTokenAuthorization(
  token: string,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    let decodedAPIAccessToken: APICordTokenData;

    try {
      decodedAPIAccessToken = validateCordTokenData(
        verify(token, env.JWT_SIGNING_SECRET, {
          algorithms: ['HS512'],
        }),
      );
    } catch (e: any) {
      if (e instanceof TokenExpiredError) {
        throw new ApiCallerError('expired_access_token');
      } else {
        throw new ApiCallerError('invalid_access_token', { message: e });
      }
    }

    const { session_id } = decodedAPIAccessToken;
    const session = await SessionEntity.findByPk(session_id);

    if (!session) {
      throw new ApiCallerError('invalid_access_token', {
        message: 'No valid session found.',
      });
    }

    if (!session.expiresAt) {
      throw new ApiCallerError('expired_access_token', {
        message: 'Access token has been revoked.',
      });
    }

    const currentDate = new Date();

    if (currentDate > session.expiresAt) {
      throw new ApiCallerError('expired_access_token');
    }

    const application = await ApplicationEntity.findByPk(session.applicationID);

    if (!application) {
      throw new ApiCallerError('project_not_found');
    }

    req.appID = session.applicationID;

    next();
  } catch (err) {
    next(err);
  }
}

function validateAppTokenData(data: any): AppServerAuthTokenData {
  if (!(data instanceof Object)) {
    throw createInvalidInputTypeMessage('Authorization token', 'object');
  }

  const { app_id, project_id, iat: _iat, exp: _exp, ...rest } = data;

  const appID = app_id || project_id;

  if (!appID) {
    throw new ApiCallerError('invalid_project_token', {
      message:
        'Please include the project_id if you are authorizing directly with a non-Cord signed token.',
    });
  }

  if (typeof appID !== 'string' || !isUUID.default(appID)) {
    throw new ApiCallerError('invalid_project_token', {
      message: createInvalidInputTypeMessage('project_id', 'UUID'),
    });
  }

  if (Object.keys(rest).length > 0) {
    throw new ApiCallerError('invalid_project_token', {
      message:
        'Authorization token payload invalid, must contain only project_id.',
    });
  }

  return { app_id: appID };
}

function validateCustomerTokenData(data: any): CustomerServerAuthTokenData {
  if (!(data instanceof Object)) {
    throw createInvalidInputTypeMessage('Authorization token', 'object');
  }

  const { customer_id } = data;

  if (!customer_id) {
    throw new ApiCallerError('invalid_customer_token', {
      message:
        'Project management auth tokens must include a customer_id field.  Refer to https://docs.cord.com/reference/authentication#Project-management-auth-token for more details.',
    });
  }

  if (typeof customer_id !== 'string' || !isUUID.default(customer_id)) {
    throw new ApiCallerError('invalid_customer_token', {
      message: createInvalidInputTypeMessage('customer_id', 'UUID'),
    });
  }

  if (
    'user_id' in data ||
    'org_id' in data ||
    'app_id' in data ||
    'project_id' in data
  ) {
    throw new ApiCallerError('invalid_customer_token', {
      message:
        'Authorization token payload invalid, must contain only customer_id.',
    });
  }

  return { customer_id };
}

async function verifyAppToken(
  token: string,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    let decodedCustomerAppToken: AppServerAuthTokenData;

    try {
      const data = decode(token);
      decodedCustomerAppToken = validateAppTokenData(data);

      const application = await ApplicationEntity.findByPk(
        decodedCustomerAppToken.app_id,
      );

      if (!application) {
        throw new ApiCallerError('project_not_found');
      }

      verify(token, application.sharedSecret, {
        clockTolerance: ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
        maxAge: `${ACCESS_TOKEN_MAX_AGE_SECONDS}s`,
        algorithms: ['HS512'],
      });
    } catch (e: any) {
      if (e instanceof ApiCallerError) {
        throw e;
      } else {
        throw new ApiCallerError('invalid_project_token', { message: e });
      }
    }

    const { app_id } = decodedCustomerAppToken;

    req.appID = app_id;
    const storage = asyncLocalStorage?.getStore();
    if (storage) {
      storage.platformApplicationID = app_id;
    }

    next();
  } catch (err) {
    next(err);
  }
}

async function verifyCustomerToken(
  token: string,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    let decodedCustomerAppToken: CustomerServerAuthTokenData;

    try {
      const data = decode(token);
      decodedCustomerAppToken = validateCustomerTokenData(data);

      const customer = await CustomerEntity.findByPk(
        decodedCustomerAppToken.customer_id,
      );

      if (!customer) {
        throw new ApiCallerError('invalid_customer_token');
      }

      verify(token, customer.sharedSecret, {
        clockTolerance: ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
        maxAge: `${ACCESS_TOKEN_MAX_AGE_SECONDS}s`,
        algorithms: ['HS512'],
      });
    } catch (e: any) {
      if (e instanceof ApiCallerError) {
        throw e;
      } else {
        throw new ApiCallerError('invalid_customer_token', { message: e });
      }
    }

    const { customer_id } = decodedCustomerAppToken;

    req.customerID = customer_id;

    next();
  } catch (err) {
    next(err);
  }
}

// Verify App-level auth tokens used for most of our REST API endpoints
async function VerifyAppServerAuthTokenImpl(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorizationHeader = req.headers.authorization;

  const accessToken =
    verifyBearerTokenInAuthorizationHeaders(authorizationHeader);

  if (isCordSignedToken(accessToken)) {
    await verifyCordBearerTokenAuthorization(accessToken, req, res, next);
  } else {
    await verifyAppToken(accessToken, req, res, next);
  }
}

export const VerifyAppServerAuthToken = forwardHandlerExceptionsToNext(
  VerifyAppServerAuthTokenImpl,
);

// Method to verify Customer-level auth tokens used only for our applications API
async function VerifyCustomerServerAuthTokenImpl(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorizationHeader = req.headers.authorization;

  const accessToken =
    verifyBearerTokenInAuthorizationHeaders(authorizationHeader);

  await verifyCustomerToken(accessToken, req, res, next);
}

export const VerifyCustomerServerAuthToken = forwardHandlerExceptionsToNext(
  VerifyCustomerServerAuthTokenImpl,
);
