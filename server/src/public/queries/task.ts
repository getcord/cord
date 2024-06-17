import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const taskQueryResolver: Resolvers['Query']['task'] = async (
  _,
  args,
  context,
) => {
  const { orgID } = assertViewerHasIdentity(context.session.viewer);
  return await context.loaders.taskLoader.loadTask(args.id, orgID);
};
