import { CORD_AUTOMATED_TESTS_APPLICATION_ID } from 'common/const/Ids.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { generateToken } from 'cypress/utils.ts';

export const testTokenQueryResolver: Resolvers['Query']['testToken'] = async (
  _,
  __,
  context,
) => {
  const app = await context.loaders.applicationLoader.load(
    CORD_AUTOMATED_TESTS_APPLICATION_ID,
  );
  if (!app) {
    throw new Error('Testing application not found');
  }

  return { token: generateToken(app.id, app.sharedSecret) };
};
