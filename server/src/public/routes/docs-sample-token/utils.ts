import type { Request } from 'express';
import {
  CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID,
  DOCS_TOKEN_KEY,
} from 'common/const/Ids.ts';
import { decodeSessionFromJWT } from 'server/src/auth/session.ts';
import { assertViewerHasPlatformIdentity } from 'server/src/auth/index.ts';

export async function extractDocTokenFromReqBody(reqBody: Request['body']) {
  try {
    if (!(DOCS_TOKEN_KEY in reqBody)) {
      throw 'docs token does not exist';
    }
    const previousToken = reqBody[DOCS_TOKEN_KEY];
    if (typeof previousToken !== 'string') {
      throw 'docs token not a string';
    }

    const session = await decodeSessionFromJWT(previousToken);

    const { platformApplicationID } = assertViewerHasPlatformIdentity(
      session.viewer,
    );

    // validating user comes from docs sample token application
    if (platformApplicationID !== CORD_DOCS_SAMPLE_TOKEN_APPLICATION_ID) {
      return null;
    }

    return previousToken;
  } catch {
    // if we get an error or token has expired we return null
    return null;
  }
}
