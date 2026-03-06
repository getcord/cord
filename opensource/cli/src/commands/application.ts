import type { Argv, InferredOptionTypes } from 'yargs';
import type { QuestionCollection } from 'inquirer';
import inquirer from 'inquirer';
import type {
  ApplicationData,
  ServerCreateApplication,
  ServerUpdateApplication,
} from '@cord-sdk/types';
import { fetchCordManagementApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { getEnvVariables, updateEnvVariables } from 'src/utils';

async function listAllApplicationsHandler() {
  const apps = await fetchCordManagementApi<ApplicationData[]>('projects');
  prettyPrint(apps);
}

async function dbDumpHandler() {
  const dump = await fetchCordManagementApi<ApplicationData[]>(
    'customer/dbdump',
    'GET',
    undefined,
    'text',
  );
  console.log(dump);
}

async function whichApplicationHandler() {
  const variables = await getEnvVariables().catch(() => {
    /* no op, catch below instead */
  });
  if (variables?.CORD_PROJECT_ID) {
    const app = await fetchCordManagementApi<ApplicationData>(
      `projects/${variables.CORD_PROJECT_ID}`,
    );
    prettyPrint(app);
  } else {
    console.error(
      `You haven't configured a project yet, please run cord init.`,
    );
  }
}

async function getApplicationHandler(argv: IdPositionalT) {
  const app = await fetchCordManagementApi<ApplicationData>(
    `projects/${argv.id}`,
  );
  prettyPrint(app);
}

async function createApplicationHandler(argv: CreateApplicationOptionsT) {
  const body: ServerCreateApplication = {
    name: argv.name,
    iconURL: argv.iconUrl,
    eventWebhookURL: argv.eventWebhookUrl,
    redirectURI: argv.redirectUri,
    emailSettings: argv.emailSettings
      ? JSON.parse(argv.emailSettings)
      : undefined,
  };

  const result = await fetchCordManagementApi(
    'projects',
    'POST',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function updateApplicationHandler(
  argv: IdPositionalT & UpdateApplicationOptionsT,
) {
  const body: ServerUpdateApplication = {
    name: argv.name,
    iconURL: argv.iconUrl,
    eventWebhookURL: argv.eventWebhookUrl,
    redirectURI: argv.redirectUri,
    emailSettings: argv.emailSettings
      ? JSON.parse(argv.emailSettings)
      : undefined,
  };
  const result = await fetchCordManagementApi(
    `projects/${argv.id}`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const confirmWithSecret: QuestionCollection<{ secret: string }> = [
  {
    name: 'secret',
    message:
      'THIS WILL DELETE THE ENTIRE PROJECT, INCLUDING ALL USERS, THREADS, AND MESSAGES. Enter the project secret to confirm you really want to delete all of this data:',
    type: 'input',
    validate: (answer: string) => {
      if (answer.length < 1) {
        return 'You must provide the project secret to delete the project';
      }
      return true;
    },
  },
];

async function deleteApplicationHandler(
  argv: IdPositionalT & { '--force'?: boolean; '-f'?: boolean },
) {
  let secret: string;
  if (argv['--force'] || argv['-f']) {
    ({ secret } = await fetchCordManagementApi<ApplicationData>(
      `projects/${argv.id}`,
    ));
  } else {
    ({ secret } = await inquirer.prompt(confirmWithSecret));
  }
  const result = await fetchCordManagementApi(
    `projects/${argv.id}`,
    'DELETE',
    JSON.stringify({ secret }),
  );
  prettyPrint(result);
}

async function selectApplicationHandler() {
  const apps = await fetchCordManagementApi<ApplicationData[]>('projects');
  const selectProject: QuestionCollection<{ selectedProject: string }> = [
    {
      name: 'selectedProject',
      message: 'Which project would you like to use?',
      type: 'list',
      choices: apps.map((app) => ({ name: app.name, value: app.id })),
    },
  ];
  const { selectedProject } = await inquirer.prompt(selectProject);
  const selectedProjectDetails = await fetchCordManagementApi<ApplicationData>(
    `projects/${selectedProject}`,
  );
  await updateEnvVariables({
    CORD_PROJECT_ID: selectedProjectDetails.id,
    CORD_PROJECT_SECRET: selectedProjectDetails.secret,
  });
  prettyPrint(`You are now querying within ${selectedProjectDetails.name}`);
}

const createOrUpdateBaseOptions = {
  iconUrl: {
    description: 'Url for project icon. Defaults to Cord logo',
    nargs: 1,
    string: true,
  },
  emailSettings: {
    description: 'Json string of your email settings object',
    nargs: 1,
    string: true,
  },
  eventWebhookUrl: {
    description: 'Url the events webhook is sent to',
    nargs: 1,
    string: true,
  },
  redirectUri: {
    description: 'Custom url link contained in email and slack notifications',
    nargs: 1,
    string: true,
  },
} as const;

const createApplicationOptions = {
  ...createOrUpdateBaseOptions,
  name: {
    description: 'Name of the project',
    nargs: 1,
    string: true,
    demandOption: true,
  },
} as const;

type CreateApplicationOptionsT = InferredOptionTypes<
  typeof createApplicationOptions
>;

const updateApplicationOptions = {
  ...createOrUpdateBaseOptions,
  name: {
    ...createApplicationOptions.name,
    demandOption: false,
  },
} as const;

type UpdateApplicationOptionsT = InferredOptionTypes<
  typeof updateApplicationOptions
>;

export const projectCommand = {
  command: ['project', 'application', 'app'],
  describe:
    'Manipulate projects. For more info refer to docs: https://docs.cord.com/rest-apis/projects',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all projects: GET https://api.cord.com/v1/projects',
        (yargs) => yargs,
        listAllApplicationsHandler,
      )
      .command('dbdump', 'Dumps all data from all projects', (yargs) => yargs, dbDumpHandler)
      .command(
        'get <id>',
        'Get a project: GET https://api.cord.com/v1/projects/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getApplicationHandler,
      )
      .command(
        'create',
        'Create a project: POST https://api.cord.com/v1/projects',
        (yargs: Argv) => yargs.options(createApplicationOptions),
        createApplicationHandler,
      )
      .command(
        'update <id>',
        'Update a project: PUT https://api.cord.com/v1/projects/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(updateApplicationOptions),
        updateApplicationHandler,
      )
      .command(
        'delete [--force] <id>',
        'Delete a project: DELETE https://api.cord.com/v1/projects/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .boolean(['--force', '-f'])
            .help(
              'force, -f',
              'delete without project secret. CAUTION! THIS WILL DELETE THE ENTIRE PROJECT, INCLUDING ALL USERS, THREADS, AND MESSAGES!',
            ),
        deleteApplicationHandler,
      )
      .command(
        'select',
        'Select a project you would like to use',
        (yargs) => yargs,
        selectApplicationHandler,
      )
      .command(
        'which',
        'See the project you are using',
        (yargs) => yargs,
        whichApplicationHandler,
      );
  },
  handler: (_: unknown) => {},
};
