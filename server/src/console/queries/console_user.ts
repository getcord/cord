import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';

export const consoleUserQueryResolver: Resolvers['Query']['consoleUser'] =
  async (_, __, context) => {
    try {
      return await ConsoleUserEntity.findOne({
        where: { email: context.session.viewer.developerUserID },
      });
    } catch (error: any) {
      context.logger.logException('Failed to fetch console user', error);
      return null;
    }
  };
