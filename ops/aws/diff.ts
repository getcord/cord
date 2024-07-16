#!/usr/bin/env node

import { promises as fs } from 'fs';
import * as path from 'path';
import { format } from 'util';

import colors from 'colors/safe.js';
import yargs from 'yargs';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import * as cf from '@aws-sdk/client-cloudformation';
import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';

const argv = yargs(process.argv.slice(2))
  .option('region', {
    type: 'string',
    description: 'AWS region',
    default: AWS_REGION,
  })
  .strict()
  .help()
  .alias('help', 'h').argv;

async function main() {
  process.stdout.write(format('Region %s\n', colors.bold(argv.region)));
  const client = new cf.CloudFormationClient({ region: argv.region });

  // Get a list of all CloudFormation stacks in this region
  const listStacksResult = await client.send(new cf.ListStacksCommand({}));
  // Remove the ones that were deleted
  const stackSummaries = (listStacksResult.StackSummaries || []).filter(
    (stack) => stack.StackStatus !== 'DELETE_COMPLETE',
  );

  // Sort by name
  stackSummaries.sort((a, b) => {
    const aname = a.StackName ?? '';
    const bname = b.StackName ?? '';

    return aname < bname ? 1 : aname > bname ? -1 : 0;
  });

  for (const stack of stackSummaries) {
    // If this stack is a root stack (i.e. not a nested stack), then check
    // differences
    if (!stack.RootId && stack.StackName && stack.StackId) {
      const stackId = stack.StackId;

      await outputDiff(
        client,
        stack.StackName,
        `${stack.StackName}.template.json`,
        'cdk.out',
        stackSummaries
          .filter((s) => s.RootId === stackId)
          .map((s) => s.StackName ?? ''),
      );
    }
  }
}

export async function outputDiff(
  client: cf.CloudFormationClient,
  stackName: string,
  templateFile: string,
  templateDirectory: string,
  stackNames: string[],
) {
  process.stdout.write(format('Stack %s', colors.bold(stackName)));

  // Load the template JSON that `cdk synth` has prepared for us
  const templateFilename = path.join(templateDirectory, templateFile);
  const templateJson = await fs
    .readFile(templateFilename, {
      encoding: 'utf-8',
    })
    .catch((err) => (err.code === 'ENOENT' ? null : Promise.reject(err)));

  // If the template file does not exist, just continue. (This happens for root
  // stacks that are not managed by this code base. E.g. the CDKToolkit stack.)
  if (templateJson === null) {
    process.stdout.write(' (no template file -> skipping)\n');
    return;
  }

  const pending = JSON.parse(templateJson);
  process.stdout.write(
    ` (${Object.keys(pending.Resources).length} resources)\n`,
  );

  // Retrieve currently deployed template from CloudFormation
  const response = await client.send(
    new cf.GetTemplateCommand({ StackName: stackName }),
  );

  const deployed = JSON.parse(response.TemplateBody || '{}');

  // Check for differences between deployed and pending
  const d = cfnDiff.diffTemplate(deployed, pending);

  // Print them out nicely
  cfnDiff.formatDifferences(process.stdout, d);

  // Find nested stacks: go through all resources of this stack
  for (const [name, changes] of Object.entries(d.resources.changes)) {
    if (changes.newResourceType !== 'AWS::CloudFormation::Stack') {
      // not a Stack resource? skip!
      continue;
    }
    if (!changes.isDifferent && changes.isAddition && changes.isRemoval) {
      // if the stack wasn't changed, or it is completely new or removed, then
      // we don't need to diff it
      continue;
    }

    // Get the JSON object from the local template about this stack resource
    const newStackResource = pending.Resources[name];
    if (!newStackResource) {
      console.warn(`Did not find stack resource in local template: ${name}`);
      continue;
    }

    // ...and get the local filename for this nested stack from it
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const path = newStackResource.Metadata?.['aws:asset:path'];

    // From all the names of stacks that we were given (those that have this
    // stack as root or share the root with this stack), pick the one that
    // corresponds to this nested stack
    const candidateNames = stackNames.filter(
      (n) => n.indexOf(`-${name}-`) >= 0,
    );

    if (candidateNames.length === 1) {
      // Check this nested stack for changes and print out the diff
      await outputDiff(
        client,
        candidateNames[0],
        path,
        templateDirectory,
        stackNames,
      );
    } else {
      console.warn(
        `Cannot display changes for ${name}, found ${
          candidateNames.length
        } matching stack names: ${candidateNames.join(', ')}`,
      );
    }
  }
}

main().then(
  () => {
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
