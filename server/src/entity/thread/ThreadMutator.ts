import type { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize';

import type {
  EntityMetadata,
  ThreadSupportStatusType,
  UUID,
} from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasSingleOrgForWrite,
} from 'server/src/auth/index.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { flagsUserFromContext } from 'server/src/featureflags/index.ts';
import { maybeAddEveryOrgMemberAsThreadParticipants } from 'server/src/message/new_message_tasks/maybeAddEveryOrgMemberAsThreadParticipants.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { addAdditionalSubscribersOnThreadCreation } from 'server/src/message/new_message_tasks/addAdditionalSubscribersOnThreadCreation.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export class ThreadMutator {
  logger: Logger;

  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {
    this.logger = new Logger(viewer);
  }
  // remember to trigger the page events PAGE_THREAD_ADDED when using
  // createThreadOnPage function
  async createThreadOnPage(
    threadID: UUID,
    threadURL: string,
    page: PageEntity,
    threadName: string,
    transaction: Transaction,
    platformApplicationID: UUID,
    externalID: string | null,
    metadata: EntityMetadata = {},
    extraClassnames: string | null = null,
    subscribers: string[] | undefined = undefined,
  ) {
    const orgID = assertViewerHasSingleOrgForWrite(
      this.viewer,
      'Must specify a groupID when creating a new thread',
    );

    const thread = await ThreadEntity.create(
      {
        id: threadID,
        orgID,
        name: threadName,
        url: threadURL,
        metadata: metadata,
        pageContextHash: page.contextHash,
        platformApplicationID,
        extraClassnames,
        ...(externalID && { externalID }),
      },
      { transaction },
    );

    transaction.afterCommit(async () => {
      const context = await contextWithSession(
        { viewer: this.viewer },
        getSequelize(),
        null,
        null,
      );

      const flagsUser = flagsUserFromContext(context);
      await maybeAddEveryOrgMemberAsThreadParticipants(
        this.viewer,
        flagsUser,
        thread.id,
      );

      // If the thread has been created by a viewer in the UI sending a message,
      // we should subscribed them immediately (see #7568)
      if (context.session.viewer.userID) {
        await new ThreadParticipantMutator(
          context.session.viewer,
          context.loaders,
        ).setViewerSubscribed(thread, true);
      }

      if (subscribers && subscribers.length > 0) {
        await addAdditionalSubscribersOnThreadCreation(
          context,
          subscribers,
          thread.id,
        );
      }
    });

    return thread;
  }

  async setThreadResolved(
    threadID: UUID,
    resolved: boolean,
    transaction?: Transaction,
  ) {
    const { userID, orgID } = assertViewerHasIdentity(this.viewer);

    const [updateCount] = await ThreadEntity.update(
      {
        resolvedTimestamp: resolved ? Sequelize.fn('NOW') : null,
        resolverUserID: userID,
      },
      { where: { id: threadID, orgID }, transaction },
    );

    return updateCount === 1;
  }

  async setThreadSupportStatus(
    threadID: UUID,
    supportStatus: ThreadSupportStatusType | null,
    transaction?: Transaction,
  ) {
    const [updated] = await ThreadEntity.update(
      { supportStatus },
      { where: { id: threadID }, transaction },
    );

    return updated === 1;
  }

  async setThreadName(threadID: UUID, name: string) {
    const [updated] = await ThreadEntity.update(
      { name },
      { where: { id: threadID } },
    );

    return updated === 1;
  }

  async setThreadMetadata(threadID: UUID, metadata: EntityMetadata) {
    const [updated] = await ThreadEntity.update(
      { metadata },
      { where: { id: threadID } },
    );

    return updated === 1;
  }
}
