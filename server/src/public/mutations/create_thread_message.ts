import { UniqueConstraintError } from 'sequelize';

import { toPageContext } from 'common/types/index.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import {
  assertViewerHasOrg,
  assertViewerHasPlatformUser,
  assertViewerHasSingleOrgForWrite,
} from 'server/src/auth/index.ts';
import { serializableTransactionWithRetries } from 'server/src/entity/sequelize.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { stripInboxCountPrefix } from 'common/page_context/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { executeNewMessageCreationTasks } from 'server/src/message/executeMessageTasks.ts';
import { MessageReactionMutator } from 'server/src/entity/message_reaction/MessageReactionMutator.ts';
import { internalizeContent } from 'server/src/public/routes/platform/messages/util.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import { validateMessageContent } from 'server/src/message/util/validateMessageContent.ts';
import { PreallocatedThreadIDEntity } from 'server/src/entity/preallocated_thread_id/PreallocatedThreadIDEntity.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export const createThreadMessageResolver: Resolvers['Mutation']['createThreadMessage'] =
  async (_, args, originalContext) => {
    const { viewer: originalViewer } = originalContext.session;
    const {
      content: internalContent,
      externalContent,
      messageID,
      threadID,
      url,
      fileAttachments,
      createNewThread,
      newThreadMetadata,
      newMessageMetadata,
      annotationAttachments,
      screenshotAttachment,
      task,
      pageName,
      threadOptions,
      externalMessageID,
      addReactions,
      iconURL,
      translationKey,
      extraClassnames,
      createThread,
    } = args.input;
    const { userID, platformApplicationID } =
      assertViewerHasPlatformUser(originalViewer);

    if (createNewThread) {
      // Check error here to make sure we throw a useful error message.
      assertViewerHasSingleOrgForWrite(
        originalViewer,
        'Thread ID does not exist and could not be created because a group ID was not specified for the new thread',
      );
    }

    if (args.input.type !== undefined) {
      deprecated('graphql: createThreadMessage type', platformApplicationID);
      if (args.input.type && args.input.type !== 'user_message') {
        throw new ApiCallerError('invalid_field', {
          message: 'Only user_messages can be sent with the JS API',
        });
      }
    }

    const pageMutator = new PageMutator(originalViewer);

    const application = await ApplicationEntity.findByPk(platformApplicationID);

    // We cannot create threads without an application.
    // We can create a reply without an application, but that can happen only from
    // messages via Slack or email, not from here! Check the relevant event handlers for those
    if (!application) {
      throw new Error(
        `Cannot access the create a new thread message resolver without having an application ID.`,
      );
    }

    if (internalContent !== undefined) {
      deprecated(
        'create_thread_message: internalContent',
        platformApplicationID,
      );
    }

    // in its own fn to assist with type-checking
    async function fetchPageAndExistingThread(): Promise<
      [PageEntity, ThreadEntity | undefined]
    > {
      let page: PageEntity | null;
      let existingThread: ThreadEntity | undefined;

      if (createNewThread) {
        const pageContext = toPageContext(args.input.pageContext);
        const pageContextHash =
          pageContext && (await pageMutator.createPageIfNotExists(pageContext));

        // If this is a new thread, it must come with a pageContext, pageContextHash
        // and url.  We can use pageContextHash to find the page.
        if (!pageContext || !pageContextHash || !url) {
          throw new Error(`Thread cannot be created in null page context`);
        }
        page =
          await originalContext.loaders.pageLoader.getPageFromContextHash(
            pageContextHash,
          );
      } else {
        // If it's a reply to an existing thread, we might not have pageContextHash
        // because this could be a reply from the inbox.  We can, however, use the
        // threadID to find it, since the thread already exists.
        existingThread =
          (await originalContext.loaders.threadLoader.loadThread(threadID)) ??
          undefined;

        if (!existingThread) {
          throw new Error('No thread found for reply');
        }

        page =
          await originalContext.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
            threadID,
          );
      }

      if (!page) {
        throw new Error('No page found');
      }

      return [page, existingThread];
    }

    const [page, existingThread] = await fetchPageAndExistingThread();

    const content = externalContent
      ? await internalizeContent(
          externalContent,
          platformApplicationID,
          existingThread?.orgID ?? assertViewerHasOrg(originalViewer),
        )
      : internalContent;
    if (!content) {
      throw new Error('No content');
    }
    validateMessageContent(content);

    const initialMessageCount = existingThread
      ? await originalContext.loaders.threadLoader.loadMessagesCountNoOrgCheck(
          existingThread.id,
        )
      : 0;
    const isFirstMessageOrNewThread =
      createNewThread || initialMessageCount === 0;

    let thread: ThreadEntity;
    let message: MessageEntity;

    // Now let's create the message, and the thread too if this is a new thread
    try {
      // We use SERIALIZABLE here because it's needed to ensure the threads and
      // thread_ids tables remain consistent, see thread_by_external_id.ts
      [message, thread] = await serializableTransactionWithRetries(
        async (transaction): Promise<[MessageEntity, ThreadEntity]> => {
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          let thread: ThreadEntity | undefined = existingThread;
          if (createNewThread) {
            if (!url) {
              // This should never happen because we checked this above and would have thrown.
              // This check is here to "remind" TypeScript that `url` is a `string`
              throw new Error(
                'Logic error: should have thrown in fetchPageAndExistingThread',
              );
            }

            const threadName =
              createThread?.name ??
              (pageName ? stripInboxCountPrefix(pageName) : url);

            const threadIDEntity = await PreallocatedThreadIDEntity.findOne({
              where: {
                platformApplicationID,
                id: threadID,
              },
              transaction,
            });

            thread = await new ThreadMutator(
              originalViewer,
              originalContext.loaders,
            ).createThreadOnPage(
              threadID,
              createThread?.url ?? url,
              page,
              threadName,
              transaction,
              application.id,
              threadIDEntity?.externalID ?? null,
              newThreadMetadata ?? createThread?.metadata ?? {},
              createThread?.extraClassnames,
              createThread?.addSubscribers ??
                threadOptions?.additionalSubscribersOnCreate,
            );
          }

          if (!thread) {
            throw new Error('Failed to find or create thread');
          }

          const messageMutator = new MessageMutator(
            originalViewer,
            originalContext.loaders,
          );
          const reactionMutator = new MessageReactionMutator(
            originalViewer,
            originalContext.loaders,
          );
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          const message = await messageMutator.createMessage(
            {
              id: messageID,
              externalID: externalMessageID ?? undefined,
              thread,
              content: content,
              url: url ?? null,
              iconURL: iconURL ?? undefined,
              translationKey: translationKey ?? undefined,
              extraClassnames: extraClassnames ?? undefined,
              metadata: newMessageMetadata ?? {},
            },
            transaction,
          );
          await Promise.all(
            (addReactions ?? []).map(async (reaction) => {
              return await reactionMutator.createOne(
                message.id,
                reaction,
                undefined,
                transaction,
              );
            }),
          );
          return [message, thread];
        },
      );
    } catch (e) {
      // This is supposed to catch cases where the frontend retries a message
      // send that it thinks failed, but which actually succeeded, and so we
      // don't want to return an error on the retry. But there may be something
      // weird going on in test which is also throwing this error and causing
      // tests to very intermittently fail? Re-throwing in tests to try that
      // hypothesis.
      if (e instanceof UniqueConstraintError && !process.env.IS_TEST) {
        return { success: true, failureDetails: null };
      }
      throw e;
    }

    const granularPermissionsEnabled = await getTypedFeatureFlagValue(
      FeatureFlags.GRANULAR_PERMISSIONS,
      flagsUserFromContext(originalContext),
    );

    // We previously would swap over the org ID in the context/viewer to that of
    // the thread. With granular permissions, we can't do that, since the user
    // might not be a member of that org. Most of our code deals with that just
    // fine (taking the org from the thread), but we aren't necessarily ready to
    // rely on that just yet, so put the removal of that logic behind the
    // granular permissions feature flag.
    let context;
    if (granularPermissionsEnabled) {
      context = originalContext;
    } else {
      context = await getRelevantContext(originalContext, thread.orgID);
    }

    const flagsUser = {
      userID,
      orgID: thread.orgID,
      platformApplicationID: application?.id ?? 'extension',
      version: context.clientVersion,
      customerID: application?.customerID,
    };

    await executeNewMessageCreationTasks({
      context,
      flagsUser,
      application,
      page,
      thread,
      message,
      fileAttachments,
      annotationAttachments,
      screenshotAttachment,
      isFirstMessage: isFirstMessageOrNewThread,
      task,
      subscribeToThread: true,
    });

    return { success: true, failureDetails: null };
  };
