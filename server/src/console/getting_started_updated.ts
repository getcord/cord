import { assertConsoleUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

export const ConsoleGettingStartedUpdatedResolver: Resolvers['ConsoleGettingStartedUpdated'] =
  {
    application: async ({ args: { applicationID } }, _, context) => {
      assertConsoleUser(context.session.viewer);

      const applicationEntity = await ApplicationEntity.findByPk(applicationID);

      if (!applicationEntity) {
        throw new Error(
          `Application not found despite receiving application event ${applicationID}`,
        );
      }

      return applicationEntity;
    },
  };
