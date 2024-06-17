import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import type { Transaction } from 'sequelize';
import { Viewer } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import {
  assertTransactionIsSerializable,
  serializableTransactionWithRetries,
} from 'server/src/entity/sequelize.ts';
import type { CreateThreadVariables } from '@cord-sdk/api-types';
import { PreallocatedThreadIDEntity } from 'server/src/entity/preallocated_thread_id/PreallocatedThreadIDEntity.ts';
import { publishNewThreadEvents } from 'server/src/entity/thread/new_thread_tasks/publishNewThreadEvents.ts';

async function CreateThreadHandler(req: Request, res: Response) {
  const {
    id: externalID,
    groupID,
    url,
    name,
    location,
    metadata,
    extraClassnames,
    addSubscribers,
    ...rest
  } = validate.CreateThreadVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }
  const app = await ApplicationEntity.findByPk(platformApplicationID);
  if (!app) {
    throw new ApiCallerError('invalid_request');
  }

  const org = await OrgEntity.findOne({
    where: {
      externalID: groupID,
      platformApplicationID,
    },
  });

  if (!org) {
    throw new ApiCallerError('group_not_found');
  }

  const viewer = Viewer.createOrgViewer(org.id, platformApplicationID);

  const thread =
    // We use SERIALIZABLE here because it's needed to ensure the threads and
    // preallocated_thread_ids tables remain consistent, see thread_by_external_id.ts
    await serializableTransactionWithRetries(async (transaction) => {
      const { thread: newThread } = await createThread({
        id: externalID,
        url,
        location,
        name,
        metadata,
        extraClassnames,
        addSubscribers,
        transaction,
        viewer,
        platformApplicationID,
      });

      await publishNewThreadEvents(location, newThread, transaction);

      return newThread;
    });

  res.status(200).json({
    success: true,
    message: 'Thread created.',
    threadID: thread.externalID,
  });
}

export default forwardHandlerExceptionsToNext(CreateThreadHandler);

export async function createThread({
  platformApplicationID,
  id: externalID,
  url,
  location,
  name,
  metadata,
  extraClassnames,
  addSubscribers,
  transaction,
  viewer,
  ...rest
}: Omit<CreateThreadVariables, 'groupID'> & {
  platformApplicationID: string;
  transaction: Transaction;
  viewer: Viewer;
}) {
  await assertTransactionIsSerializable(transaction);
  // Check that all properties in CreateThreadVariables are destructured
  const _: Record<string, never> = rest;
  if (externalID) {
    validateExternalID(externalID, 'id');

    const existingThread = await ThreadEntity.findOne({
      where: {
        externalID,
        platformApplicationID,
      },
      transaction,
    });

    if (existingThread) {
      throw new ApiCallerError('thread_already_exists');
    }
  }
  const { page } = await new PageMutator(viewer).getPageCreateIfNotExists(
    { data: location, providerID: null },
    transaction,
  );
  const threadIDEntity = externalID
    ? await PreallocatedThreadIDEntity.findOne({
        where: {
          platformApplicationID,
          externalID,
        },
        transaction,
      })
    : undefined;

  const thread = await new ThreadMutator(viewer, null).createThreadOnPage(
    threadIDEntity?.id ?? uuid(),
    url,
    page,
    name,
    transaction,
    platformApplicationID,
    externalID ?? null,
    metadata,
    extraClassnames ?? undefined,
    addSubscribers,
  );

  return { thread, page };
}
