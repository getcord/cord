import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';

import { serializableTransactionWithRetries } from 'server/src/entity/sequelize.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasPlatformApplicationID,
} from 'server/src/auth/index.ts';
import {
  isValidExternalID,
  isExternalizedID,
  extractInternalID,
} from 'common/util/externalIDs.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';
import { PreallocatedThreadIDEntity } from 'server/src/entity/preallocated_thread_id/PreallocatedThreadIDEntity.ts';

export const threadByExternalID2QueryResolver: Resolvers['Query']['threadByExternalID2'] =
  async (_, { input: { externalThreadID } }, context) => {
    if (
      !isExternalizedID(externalThreadID) &&
      !isValidExternalID(externalThreadID)
    ) {
      throw new Error('external threadID is not valid');
    }
    const { viewer } = context.session;

    const platformApplicationID = assertViewerHasPlatformApplicationID(viewer);

    // We use SERIALIZABLE here because this transaction falls directly in the
    // area where READ_COMMITTED fails: we read one table, and then write to a
    // different table based on what we read.  If this code runs at the same
    // time as a different transaction inserts a row into the threads table,
    // we might end up with one ID for the externalID in the threads table and
    // a different one in the thread_ids table.
    return await serializableTransactionWithRetries(async (transaction) => {
      const thread =
        await context.loaders.threadLoader.loadByExternalIDStrictOrgCheck(
          externalThreadID,
          transaction,
        );

      if (thread) {
        return { id: thread.id, thread };
      } else {
        // It's possible that the client is requested a threadID that DOES
        // exist however not in viewer.org - in which case they will not be able
        // to create it later, and we should error
        const orgIDs = assertViewerHasOrgs(viewer);
        const externalThreadIDUsedInDifferentOrg = await ThreadEntity.findOne({
          where: {
            externalID: externalThreadID,
            platformApplicationID,
            orgID: { [Op.notIn]: orgIDs },
          },
          transaction,
        });

        if (externalThreadIDUsedInDifferentOrg) {
          // We have a database constraint that doesn't allow the same external thread ID to be used
          // across a single platform application.
          throw new ClientFacingError(
            'Thread ID is already in use by another group in this application',
          );
        }
      }

      if (isExternalizedID(externalThreadID)) {
        // This is an externalized ID, we know what the associated internal ID
        // is without doing anything
        return {
          id: extractInternalID(externalThreadID)!,
          thread: null,
        };
      }

      const [threadID] = await PreallocatedThreadIDEntity.findOrCreate({
        where: {
          platformApplicationID,
          externalID: externalThreadID,
        },
        defaults: {
          id: uuid(),
          platformApplicationID,
          externalID: externalThreadID,
        },
        transaction,
      });

      return {
        id: threadID.id,
        thread: null,
      };
    });
  };
