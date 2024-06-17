import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

export const createApplicationResolver: Resolvers['Mutation']['createApplication'] =
  async (_, args, _context) => {
    const { name, customerID } = args;

    const application = await ApplicationEntity.create({
      name,
      customerID,
    });

    return application.id;
  };
