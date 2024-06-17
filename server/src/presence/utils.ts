import type { JsonObject } from 'common/types/index.ts';
import { isLocation } from 'common/types/index.ts';
import { assertViewerHasPlatformIdentity } from 'server/src/auth/index.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';
import { PageVisitorMutator } from 'server/src/entity/page_visitor/PageVisitorMutator.ts';
import {
  setUserPresence,
  removeUserPresence,
} from 'server/src/presence/context.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';

type SetPresentContextProps = {
  userContext: JsonObject;
  present: boolean;
  durable: boolean;
  exclusivityRegion: JsonObject | undefined | null;
  context: RequestContext;
};

// Does all the work in setting a user's durable and ephemeral presence
export async function setUserPresentContext({
  userContext,
  present,
  durable,
  exclusivityRegion,
  context,
}: SetPresentContextProps) {
  const { userID, orgID, externalUserID } = assertViewerHasPlatformIdentity(
    context.session.viewer,
  );
  if (!exclusivityRegion) {
    exclusivityRegion = userContext;
  }
  if (!isLocation(userContext)) {
    throw new Error('Invalid context');
  }
  if (!present && durable) {
    throw new Error('Cannot remove durable presence');
  }
  if (!isLocation(exclusivityRegion)) {
    throw new Error('Invalid exclusivity region');
  }

  if (durable) {
    const pageContextHash = await new PageMutator(
      context.session.viewer,
    ).createPageIfNotExists({
      data: userContext,
      providerID: null,
    });
    await new PageVisitorMutator(context.session.viewer).markPresentInPage(
      pageContextHash,
    );
    const visit = await PageVisitorEntity.findOne({
      where: {
        orgID,
        userID,
        pageContextHash,
      },
    });
    if (!visit) {
      throw new Error('Internal error');
    }
    await publishPubSubEvent(
      'context-presence',
      { orgID },
      {
        externalUserID,
        durable: {
          context: userContext,
          timestamp: visit.lastPresentTimestamp.getTime(),
        },
      },
    );
  } else {
    if (present) {
      await setUserPresence(
        context.logger,
        externalUserID,
        orgID,
        userContext,
        exclusivityRegion,
      );
    } else {
      await removeUserPresence(
        externalUserID,
        orgID,
        userContext,
        exclusivityRegion,
      );
    }
  }
}
