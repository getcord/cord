import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const s3BucketQueryResolver: Resolvers['Query']['s3Bucket'] = (
  _,
  args,
  context,
) => context.loaders.s3BucketLoader.load(args.id);
