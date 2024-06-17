import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { userHasAccessToApplication } from 'server/src/console/utils.ts';

const MAX_NUMBER_OF_USERS_TO_LOAD = 20;

export const getUsersQueryResolver: Resolvers['Query']['getUsers'] = async (
  _,
  args,
  context,
) => {
  const hasAccessToApplication = await userHasAccessToApplication(
    context.session.viewer,
    args.applicationID,
    context.loaders.consoleUserLoader,
  );

  if (!hasAccessToApplication) {
    return null;
  }

  const numberOfUsers =
    args.limit && args.limit < MAX_NUMBER_OF_USERS_TO_LOAD
      ? args.limit
      : MAX_NUMBER_OF_USERS_TO_LOAD;

  const users = await context.loaders.userLoader.loadUsersInApplication(
    args.applicationID,
    numberOfUsers,
  );

  return users.map(
    ({
      externalID,
      name,
      email,
      profilePictureURL,
      createdTimestamp,
      state,
    }) => {
      return {
        id: externalID,
        name,
        email,
        profilePictureURL,
        status: state,
        createdTimestamp,
      };
    },
  );
};
