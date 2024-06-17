import type { Argv } from 'yargs';
import type { QuestionCollection } from 'inquirer';
import inquirer from 'inquirer';
import { getEnvVariables, updateEnvVariables } from 'src/utils';

async function initializeCord() {
  const defaultAnswers = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  console.log(
    'All of the following can be found at https://console.cord.com/projects',
  );
  const questions: QuestionCollection<{
    CORD_PROJECT_ID: string;
    CORD_PROJECT_SECRET: string;
    requiresAppCommands: boolean;
    CORD_CUSTOMER_ID?: string;
    CORD_CUSTOMER_SECRET?: string;
  }> = [
    {
      name: 'CORD_PROJECT_ID',
      default: defaultAnswers?.CORD_PROJECT_ID,
      message: 'The ID of the project you wish to query within:',
      type: 'input',
      validate: (answer: string) => {
        if (answer.length < 1) {
          return 'This is required to run the commands';
        }
        return true;
      },
    },
    {
      name: 'CORD_PROJECT_SECRET',
      default: defaultAnswers?.CORD_PROJECT_SECRET,
      message: 'The secret of the project you wish to query within:',
      type: 'input',
      validate: (answer: string) => {
        if (answer.length < 1) {
          return 'This is required to run the commands';
        }
        return true;
      },
    },
    {
      name: 'requiresAppCommands',
      message:
        'Will you be running any project management commands? (You will need extra credentials available only on a paid plan):',
      type: 'confirm',
      default: false,
    },
    {
      name: 'CORD_CUSTOMER_ID',
      default: defaultAnswers?.CORD_CUSTOMER_ID,
      message:
        'Find your customer ID and secret under the `Your Account API keys` section in https://console.cord.com/settings/customer. Your customer ID:',
      type: 'input',
      when: (currentAnswers) => currentAnswers.requiresAppCommands,
    },
    {
      name: 'CORD_CUSTOMER_SECRET',
      default: defaultAnswers?.CORD_CUSTOMER_SECRET,
      message: 'Your customer secret:',
      type: 'input',
      when: (currentAnswers) => currentAnswers.requiresAppCommands,
    },
  ];

  const {
    CORD_PROJECT_ID,
    CORD_PROJECT_SECRET,
    CORD_CUSTOMER_ID,
    CORD_CUSTOMER_SECRET,
  } = await inquirer.prompt(questions);
  const includeCustomerID =
    CORD_CUSTOMER_ID && CORD_CUSTOMER_ID.trim().length > 0;
  const includeCustomerSecret =
    CORD_CUSTOMER_SECRET && CORD_CUSTOMER_SECRET.trim().length > 0;

  const variablesToAdd = {
    CORD_PROJECT_ID,
    CORD_PROJECT_SECRET,
    ...(includeCustomerID ? { CORD_CUSTOMER_ID } : {}),
    ...(includeCustomerSecret ? { CORD_CUSTOMER_SECRET } : {}),
  };

  await updateEnvVariables(variablesToAdd);
  const envString = Object.entries(variablesToAdd)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  console.log(
    'These variables have now been added to a .cord file in your home directory:',
  );
  console.log(envString);

  if (includeCustomerID && !includeCustomerSecret) {
    console.log(
      'You will still need to configure your customer secret to execute project commands.',
    );
  }
}
export const initCommand = {
  command: 'init',
  description: 'Initialize your Cord instance',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        '$0',
        'Initialize your Cord instance',
        (yargs) => yargs,
        initializeCord,
      );
  },
  handler: (_: unknown) => {},
};
