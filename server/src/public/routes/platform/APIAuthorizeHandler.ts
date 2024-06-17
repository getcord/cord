import type { Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID.js';
import isJWT from 'validator/lib/isJWT.js';
import { sign, verify, decode } from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import env from 'server/src/config/Env.ts';
import { ACCESS_TOKEN_TTL_HOURS } from 'common/const/IntegrationAPI.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import {
  ApiCallerError,
  createInvalidInputTypeMessage,
  validateInput,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import type { UUID, APICordTokenData } from 'common/types/index.ts';
import {
  ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from 'common/const/Timing.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

type APIAuthorizeVariables = {
  signed_app_token: string;
};

type SignedAppTokenData = {
  app_id: UUID;
};

function validateTokenData(data: any): SignedAppTokenData {
  if (!(data instanceof Object)) {
    throw createInvalidInputTypeMessage('signed_app_token payload', 'object');
  }

  const { app_id } = data;

  if (!app_id) {
    throw 'signed_app_token payload is missing app_id.';
  }

  if (typeof app_id !== 'string' || !isUUID.default(app_id)) {
    throw createInvalidInputTypeMessage('app_id', 'UUID');
  }

  if ('user_id' in data || 'org_id' in data) {
    throw 'signed_app_token payload invalid, must contain only app_id';
  }

  return { app_id };
}

async function authorizeHandler(req: Request, res: Response) {
  deprecated('/v1/authorize');
  const { signed_app_token } = validateInput<APIAuthorizeVariables>(req.body, {
    required: {
      signed_app_token: (value) =>
        (typeof value === 'string' && isJWT.default(value)) || 'JWT',
    },
  });

  let decodedSignedAppToken: SignedAppTokenData;

  try {
    const data = decode(signed_app_token);
    decodedSignedAppToken = validateTokenData(data);

    const application = await ApplicationEntity.findByPk(
      decodedSignedAppToken.app_id,
    );

    if (!application) {
      throw new ApiCallerError('project_not_found');
    }

    verify(signed_app_token, application.sharedSecret, {
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

  const { app_id } = decodedSignedAppToken;

  const session = await SessionEntity.create({
    applicationID: app_id,
    expiresAt: Sequelize.literal(
      `NOW() + INTERVAL '${ACCESS_TOKEN_TTL_HOURS} hours'`,
    ),
  });

  const payload: APICordTokenData = {
    session_id: session.id,
  };

  const accessToken = sign(payload, env.JWT_SIGNING_SECRET, {
    expiresIn: `${ACCESS_TOKEN_TTL_HOURS}h`,
    algorithm: 'HS512',
  });

  return res.json({
    access_token: accessToken,
    expires: session.expiresAt.toISOString(),
  });
}

export default forwardHandlerExceptionsToNext(authorizeHandler);
