import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { assertValid, validateFileForUpload } from 'common/uploads/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

export const createFileMutationResolver: Resolvers['Mutation']['createFile'] =
  async (_, args, originalContext) => {
    const { id, name, mimeType, size, provider, application, threadOrgID } =
      args;

    if (provider !== undefined) {
      deprecated('createFile: provider');
    }
    if (application !== undefined) {
      deprecated('createFile: application');
    }

    assertValid(
      validateFileForUpload('attachment', { name, mimeType, size: size ?? 0 }),
    );

    const context = await getRelevantContext(originalContext, threadOrgID);

    const mutator = new FileMutator(context.session.viewer, context.loaders);
    const file = await mutator.createFileForUpload(
      id,
      name,
      mimeType,
      size ?? 0,
      undefined,
    );

    return {
      uploadURL: size
        ? await file.getSignedUploadURL(context.loaders.s3BucketLoader)
        : null,
      downloadURL: await file.getSignedDownloadURL(
        context.loaders.s3BucketLoader,
      ),
    };
  };
