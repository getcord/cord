import { assertValid, validateFileForUpload } from 'common/uploads/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';

export const refreshFileUploadURLMutationResolver: Resolvers['Mutation']['refreshFileUploadURL'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);

    const { id, size } = args;

    const file = await context.loaders.fileLoader.loadFile(id);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userID !== userID) {
      throw new Error('File does not belong to viewer');
    }

    assertValid(
      validateFileForUpload('attachment', {
        name: file.name,
        mimeType: file.mimeType,
        size,
      }),
    );

    // update the known file size
    await file.update({ size });

    return await file.getSignedUploadURL(context.loaders.s3BucketLoader);
  };
