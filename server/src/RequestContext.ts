import type { Sequelize } from 'sequelize';
import type { Request } from 'express';
import { v4 as uuid } from 'uuid';

import type { Session } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { DeploymentType, UUID } from 'common/types/index.ts';
import { ApplicationLoader } from 'server/src/entity/application/ApplicationLoader.ts';
import { HeimdallLoader } from 'server/src/entity/heimdall/HeimdallLoader.ts';
import { SegmentLogger } from 'server/src/logging/segment.ts';
import heimdallSwitches from 'common/const/HeimdallSwitches.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { CordError } from 'server/src/util/CordError.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export type RequestWithContext = Request & {
  context: RequestContext;
};

export function assertRequestHasContext(req: Request): RequestContext {
  if (
    !('context' in req) ||
    typeof req.context !== 'object' ||
    !req.context ||
    !('connectionID' in req.context) ||
    !('session' in req.context)
  ) {
    throw new ApiCallerError('invalid_access_token');
  }
  return (req as RequestWithContext).context;
}

export type RequestContext = {
  connectionID: UUID;
  session: Session;
  sequelize: Sequelize;
  clientVersion: string | null;
  deployment: DeploymentType | null;
  logger: Logger;
  segmentLogger: SegmentLogger;
  application: ApplicationEntity | null;
  loaders: RequestContextLoaders;
};

export async function contextWithSession(
  session: Session,
  sequelize: Sequelize,
  clientVersion: string | null,
  deployment: DeploymentType | null,
): Promise<RequestContext> {
  const connectionID = uuid();
  const heimdallLoader = new HeimdallLoader(session.viewer);
  const applicationLoader = new ApplicationLoader(session.viewer);
  const loggingToSegment = await heimdallLoader.load(
    heimdallSwitches.LOG_TO_SEGMENT,
  );
  const application = session.viewer.platformApplicationID
    ? await applicationLoader.load(session.viewer.platformApplicationID)
    : null;
  return await buildContext(
    session,
    sequelize,
    clientVersion,
    deployment,
    connectionID,
    application,
    loggingToSegment?.isOn() ?? false,
  );
}

async function buildContext(
  session: Session,
  sequelize: Sequelize,
  clientVersion: string | null,
  deployment: DeploymentType | null,
  connectionID: UUID,
  application: ApplicationEntity | null,
  logToSegment: boolean,
) {
  return {
    connectionID,
    session,
    sequelize,
    clientVersion,
    application,
    logger: new Logger(session.viewer, { connectionID, deployment }),
    deployment,
    segmentLogger: new SegmentLogger(
      session,
      clientVersion,
      connectionID,
      deployment,
      logToSegment,
      application,
    ),
    loaders: await getNewLoaders(session.viewer),
  };
}

async function contextWithOtherOrg(
  context: RequestContext,
  orgID: UUID,
): Promise<RequestContext> {
  const userID = assertViewerHasUser(context.session.viewer);
  const [org, orgMembership] = await Promise.all([
    context.loaders.orgLoader.loadOrg(orgID),
    context.loaders.orgMembersLoader.loadUserOrgMembership(userID, orgID),
  ]);
  if (!org || !orgMembership) {
    throw new CordError(
      'Cannot create context for org user is not a member of',
      { orgID },
    );
  }
  return await buildContext(
    {
      ...context.session,
      viewer: context.session.viewer.viewerInOtherOrg(
        orgID,
        org.externalProvider === 'platform' ? org.externalID : undefined,
      ),
    },
    context.sequelize,
    context.clientVersion,
    context.deployment,
    context.connectionID,
    context.application,
    context.segmentLogger.switchedOn,
  );
}

// Used to make the unified inbox work - if a user is a member of orgs A and B,
// logged in as org A but performing an action on a thread in org B from the
// unified inbox, this will create a new context using the other org
export async function getRelevantContext(
  originalContext: RequestContext,
  threadOrgID?: UUID | null,
) {
  return !threadOrgID || originalContext.session.viewer.orgID === threadOrgID
    ? originalContext
    : await contextWithOtherOrg(originalContext, threadOrgID);
}
