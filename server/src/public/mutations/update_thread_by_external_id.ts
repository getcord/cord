import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { updateThread } from 'server/src/public/routes/platform/threads/UpdateThreadHandler.ts';
import { assertViewerHasPlatformUser } from 'server/src/auth/index.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export const updateThreadByExternalIDResolver: Resolvers['Mutation']['updateThreadByExternalID'] =
  sendErrors(
    async (
      _,
      {
        externalThreadID,
        url,
        name,
        metadata,
        resolved,
        extraClassnames,
        typing,
      },
      context,
    ) => {
      const { platformApplicationID, externalUserID } =
        assertViewerHasPlatformUser(context.session.viewer);

      const thread =
        await context.loaders.threadLoader.loadByExternalIDStrictOrgCheck(
          externalThreadID,
        );
      if (!thread) {
        throw new ApiCallerError('thread_not_found');
      }

      await updateThread({
        platformApplicationID,
        threadID: externalThreadID,
        name: name ?? undefined,
        url: url ?? undefined,
        metadata: metadata ?? undefined,
        resolved: resolved ?? undefined,
        userID: externalUserID,
        extraClassnames,
        typing: typing ? [externalUserID] : undefined,
      });

      return { success: true, failureDetails: null };
    },
  );
