import { Viewer } from 'server/src/auth/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { CLACK_APPLICATION_ID } from 'common/const/Ids.ts';
import {
  executeThreadByExternalID2Query,
  executeThreadListQuery,
} from 'server/src/schema/operations.ts';

export async function warmup() {
  try {
    for (let i = 0; i < 10; i++) {
      await warmupPass();
    }
  } catch (e) {
    anonymousLogger().logException('Warmup failed, continuing anyway', e);
  }
}

async function warmupPass() {
  const [user, org] = await Promise.all([
    UserEntity.findOne({
      where: {
        platformApplicationID: CLACK_APPLICATION_ID,
        externalID: 'rolo',
      },
    }),
    OrgEntity.findOne({
      where: {
        platformApplicationID: CLACK_APPLICATION_ID,
        externalID: 'clack_all',
      },
    }),
  ]);

  if (!user || !org) {
    throw new Error('Could not load warmup user or org');
  }

  const viewer = await Viewer.createLoggedInPlatformViewer({ user, org });
  const context = await contextWithSession(
    { viewer },
    getSequelize(),
    'warmup',
    null,
  );

  const [threadListResult, threadResult] = await Promise.all([
    executeThreadListQuery({
      context,
      variables: {
        _externalOrgID: undefined,
        location: { channel: 'what-the-quack' },
        partialMatch: false,
        filter: { metadata: undefined, viewer: undefined },
        resolved: undefined,
        sort: { sortBy: 'first_message_timestamp', sortDirection: 'ascending' },
        limit: 10,
        after: undefined,
      },
    }),
    executeThreadByExternalID2Query({
      context,
      variables: {
        _externalOrgID: undefined,
        initialFetchCount: 10,
        input: {
          externalThreadID: 'cord:cbfafd39-09db-4992-894c-4c7db4251807',
        },
      },
    }),
  ]);

  if (threadListResult.threadsAtLocation.hasMore !== true) {
    throw new Error('Failed to load warmup thread list');
  }

  if (threadResult.threadByExternalID2.thread?.externalOrgID !== 'clack_all') {
    throw new Error('Failed to load warmup thread');
  }
}
