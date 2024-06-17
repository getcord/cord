import * as jwt from 'jsonwebtoken';
import type { Argv, InferredOptionTypes } from 'yargs';
import type { UserIdPositionalT } from 'src/positionalArgs';
import { userIdPositional } from 'src/positionalArgs';
import { getEnvVariables } from 'src/utils';

async function clientAuthTokenHandler(argv: ClientAuthTokenOptionsT) {
  const env = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  if (!env || !env.CORD_PROJECT_ID || !env.CORD_PROJECT_SECRET) {
    throw new Error('Please initialize cord first. Run cord init.');
  }
  console.log(
    jwt.sign(
      { user_id: argv.userID, app_id: env.CORD_PROJECT_ID },
      env.CORD_PROJECT_SECRET,
      {
        algorithm: 'HS512',
        expiresIn: argv.expires,
      },
    ),
  );
}

const clientAuthTokenOptions = {
  expires: {
    description: 'Length of time for the token to be valid',
    nargs: 1,
    string: true,
    default: '1 min',
  },
} as const;
type ClientAuthTokenOptionsT = UserIdPositionalT &
  InferredOptionTypes<typeof clientAuthTokenOptions>;

export const clientAuthTokenCommand = {
  /* cspell:disable-next-line */
  command: ['client-auth-token', 'clientauthtoken', 'clientAuthToken'],
  describe:
    'Create a client auth token. For more info refer to docs: https://docs.cord.com/reference/authentication',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        '$0 <userID>',
        'Create a client auth token',
        (yargs: Argv) =>
          yargs
            .positional('userID', userIdPositional.userID)
            .options(clientAuthTokenOptions),
        clientAuthTokenHandler,
      );
  },
  handler: (_: unknown) => {},
};
