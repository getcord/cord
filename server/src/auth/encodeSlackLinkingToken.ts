import type { SlackStateLinkingType } from 'server/src/schema/resolverTypes.ts';
import {
  assertViewerHasOrg,
  assertViewerHasPlatformIdentity,
} from 'server/src/auth/index.ts';
import { encodeSlackOAuthState } from 'server/src/auth/oauth.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';

export async function encodeSlackLinkingToken(
  context: RequestContext,
  nonce: string,
  type: SlackStateLinkingType,
) {
  let encodedSlackLinkingToken: string | undefined;

  if (type === 'link_org') {
    const { userID, orgID, platformApplicationID } =
      assertViewerHasPlatformIdentity(context.session.viewer);

    const state = {
      nonce,
      type,
      data: { userID, orgID, platformApplicationID },
    };

    encodedSlackLinkingToken = encodeSlackOAuthState(state);
  }

  if (!encodedSlackLinkingToken) {
    throw new Error(`Encoded slack token missing: ${{ type, nonce }}`);
  }

  // this assumes that the viewer object always has a orgID
  const orgID = assertViewerHasOrg(context.session.viewer);

  const org = await context.loaders.orgLoader.loadOrg(orgID);

  const linkedOrg = await org?.loadLinkedSlackOrg();

  return { token: encodedSlackLinkingToken, slackTeam: linkedOrg?.externalID };
}
