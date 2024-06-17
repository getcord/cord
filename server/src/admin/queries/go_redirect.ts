import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { AdminGoRedirectEntity } from 'server/src/entity/go_redirect/AdminGoRedirectEntity.ts';

export const goRedirectQueryResolver: Resolvers['Query']['goRedirect'] = async (
  _,
  args,
) => {
  const redirect = await AdminGoRedirectEntity.findOne({
    where: { name: args.name },
  });
  return redirect;
};
