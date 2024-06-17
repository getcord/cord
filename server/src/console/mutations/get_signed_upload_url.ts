import { v4 as uuid } from 'uuid';
import { assertValid, validateFileForUpload } from 'common/uploads/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';
import env from 'server/src/config/Env.ts';
import {
  getSignedUploadURL,
  getPublicBucketDownloadURL,
} from 'server/src/files/upload.ts';

/**
 * Get a signed upload URL the client can use to upload a file to S3.
 * NOTE: The filename generated will be unique.
 */
export const getSignedUploadURLResolver: Resolvers['Mutation']['getSignedUploadURL'] =
  async (_, args, context) => {
    const { applicationID, size, mimeType, assetName } = args;
    const userEmail = context.session.viewer.developerUserID!;
    const hasAccessToApplication = await userHasAccessToApplication(
      context.session.viewer,
      applicationID,
      context.loaders.consoleUserLoader,
    );

    if (!hasAccessToApplication) {
      context.logger.error(
        'User without access to application tried to update it.',
        {
          userEmail,
          applicationID,
        },
      );
      throw new Error('Insufficient permissions to edit the application.');
    }

    assertValid(
      validateFileForUpload('application_asset', {
        name: assetName,
        mimeType,
        size,
      }),
    );

    const publicUploadsBucket = {
      bucket: env.S3_PUBLIC_BUCKET,
      region: env.S3_REGION,
      accessKeyID: env.S3_ACCESS_KEY_ID,
      accessKeySecret: env.S3_ACCESS_KEY_SECRET,
    };

    // Uploading a file with the same filename to S3 does NOT invalidate
    // CloudFront cache. E.g. if a user uploads a new logo via the console,
    // the old logo would still be served until the cache expires.
    // To avoid that, we append a uuid at the end of the filename.
    const fileID = applicationID + '-' + assetName + '-' + uuid();
    const uploadURL = getSignedUploadURL(
      fileID,
      size,
      mimeType,
      publicUploadsBucket,
    );

    return {
      uploadURL,
      downloadURL: getPublicBucketDownloadURL(fileID),
    };
  };
