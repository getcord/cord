import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { DOCS_TOKEN_EXPIRY_SECONDS } from 'common/const/Timing.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { extractDocTokenFromReqBody } from 'server/src/public/routes/docs-sample-token/utils.ts';
import { createDummyDataForDocsIfNotExist } from 'server/src/public/routes/docs-sample-token/populateLiveComponents.ts';
import { CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID } from 'common/const/Ids.ts';
import { TEAM_PROFILES } from 'common/const/TeamProfiles.ts';
/**
 * Generate a session token to be used live components on docs.
 *
 * This handler will:
 * 1. Sign a token with a random user and org uuid.
 * 2. Return the signed session token.
 */
async function getDocsSampleSignedTokenHandler(
  { body }: Request,
  res: Response,
) {
  anonymousLogger().debug('Provisioned docs sample token', { body });

  let session_token = await extractDocTokenFromReqBody(body);

  if (!session_token) {
    const application = await ApplicationEntity.findByPk(
      CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
    );

    if (!application) {
      throw new Error('Sample docs token application missing');
    }

    const randomIndex = Math.floor(Math.random() * TEAM_PROFILES.length);

    session_token = jwt.sign(
      {
        app_id: CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
        user_id: uuid(),
        organization_id: uuid(),
        user_details: {
          name: TEAM_PROFILES[randomIndex].firstName,
          email: `sample-doc-user@${Math.floor(
            Math.random() * 1000000000,
          )}.cord.com`,
          profile_picture_url: TEAM_PROFILES[randomIndex].profilePictureURL,
        },
        organization_details: {
          name: 'Sample Doc Org',
        },
      },
      application.sharedSecret,
      {
        algorithm: 'HS512',
        expiresIn: DOCS_TOKEN_EXPIRY_SECONDS,
      },
    );
  }

  try {
    await createDummyDataForDocsIfNotExist({ sessionToken: session_token });
  } catch (error) {
    const errorOptions: ErrorOptions = {};
    if (error instanceof Error) {
      errorOptions.cause = error;
    }
    throw new Error('Creating dummy data for docs failed', errorOptions);
  }

  return res.json({ client_auth_token: session_token });
}

export default forwardHandlerExceptionsToNext(getDocsSampleSignedTokenHandler);
