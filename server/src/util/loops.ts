import { v4 as uuid } from 'uuid';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
const LOOPS_API_ENDPOINT = 'https://app.loops.so/api';
import Env from 'server/src/config/Env.ts';

export async function addNewConsoleUserToLoops({
  consoleUserId,
  email,
  firstName,
  lastName,
  context,
}: {
  consoleUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  context: RequestContext;
}) {
  const loopsApiKey = Env.LOOPS_SO_API_KEY;

  try {
    if (!loopsApiKey) {
      throw new Error('Loops API key not found.');
    }

    const loopsUser = await findLoopsContact({ email, context });
    const loopsUserID =
      loopsUser && loopsUser.loopsUserID ? loopsUser.loopsUserID : uuid();

    // if user doesn't exist in loops, we create them
    if (!loopsUser) {
      const contactProperties: { [key: string]: string | number | boolean } = {
        email,
        selfServeSignUp: 'Yes',
        newsletterList: true,
        userId: consoleUserId,
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        loopsUserId: loopsUserID,
      };

      const response = await fetch(`${LOOPS_API_ENDPOINT}/v1/contacts/create`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${loopsApiKey}`,
        },
        body: JSON.stringify(contactProperties),
      });

      if (response.status !== 200) {
        const data = await response.json();
        throw new Error(`Unable to add user to Loops. Error: ${data.message}`);
      }
    }

    // if user exists in loops, but have no loopsUserID, we should update that field
    if (loopsUser && !loopsUser.loopsUserID) {
      const response = await fetch(`${LOOPS_API_ENDPOINT}/v1/contacts/update`, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${loopsApiKey}`,
        },
        body: JSON.stringify({ email, loopsUserId: loopsUserID }),
      });

      if (response.status !== 200) {
        const data = await response.json();
        throw new Error(`Unable to update loops user. Error: ${data.message}`);
      }
    }

    // once we have a user in loops, we update cord user
    // this way, in our sync_user flow where we call this function
    // we don't have call the loops api to check if the user exists
    await ConsoleUserEntity.update(
      { loopsUserID },
      { where: { id: consoleUserId } },
    );
  } catch (error) {
    if (error instanceof Error) {
      context.logger.error(`Console user not synced in loops`, {
        erroMessage: error.message,
        consoleUserId,
      });
    }
  }
}

export async function findLoopsContact({
  email,
  context,
}: {
  email: string;
  context: RequestContext;
}) {
  const loopsApiKey = Env.LOOPS_SO_API_KEY;
  if (!loopsApiKey) {
    context.logger.error('Loops API key not found.');
  }

  const url = new URL(`${LOOPS_API_ENDPOINT}/v1/contacts/find`);
  url.searchParams.append('email', email);
  const response = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${loopsApiKey}`,
    },
  });

  //  Loops returns an empty array if no user was found
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(
      `Unable to fetch loops user with email: ${email} error: ${data.message}`,
    );
  }

  return data.length > 0 ? data[0] : undefined;
}
