import chalk from 'chalk';
import Box from 'cli-box';
import fetch from 'node-fetch';
import {
  getEnvVariables,
  isLaterCliVersion,
  updateEnvVariables,
} from 'src/utils';
import packageData from 'package.json';

export async function checkVersion() {
  const variables = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });

  // we shouldn't fetch version or print update message if the version has been fetched within the last day
  if (variables?.VERSION_LAST_CHECKED) {
    const lastValidVersionDate = new Date(+variables.VERSION_LAST_CHECKED);
    lastValidVersionDate.setDate(lastValidVersionDate.getDate() + 1);
    if (lastValidVersionDate.getTime() > Date.now()) {
      return;
    }
  }

  // fetch latest version from npm
  // update env variables
  // if outdated, print update message
  const res = await fetch('https://api.cord.com/v1/cli-version');
  const response = (await res.json()) as { version: string };
  const publishedVersion: string = response.version;
  await updateEnvVariables({
    VERSION_LAST_CHECKED: Date.now().toString(),
  });

  if (isLaterCliVersion(publishedVersion, packageData.version)) {
    const box = Box(
      { h: 3, w: 50, stringify: false },
      `👋 ${chalk.bold('There is a newer version available!')}
To update from ${chalk.bold(packageData.version)} to ${chalk.bold(
        publishedVersion,
      )} run:
npm update -g @cord-sdk/cli\n`,
    );
    process.stderr.write(box.stringify() + '\n');
  }
}
