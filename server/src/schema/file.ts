import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const fileResolver: Resolvers['File'] = {
  url: (file, _args, context) =>
    file.getSignedDownloadURL(context.loaders.s3BucketLoader),
};
