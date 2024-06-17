#!/usr/bin/env -S node --enable-source-maps

// This script helps with syncing our opensource repositories with
// subdirectories in monorepo.
//
// Syncing can go both ways: importing new commits from the subrepo into
// monorepo, and exporting new commits touching the opensource folder from
// monorepo to a subrepo.
//
// To sync one of the opensource project, e.g. `sdk-js`: build/index.mjs
//    --target=scripts/sync-opensource-repo.ts &&
//    dist/scripts/sync-opensource-repo.js --name sdk-js
//
// The script will:
// * in your local monorepo repository, create a remote called
//   `opensource-sdk-js` (unless one exists already)
// * fetch from that remote, so we have the history of the opensource repo
//   (there will be remote branches like `opensource-sdk-js/master`)
// * compare the history of the `opensource/sdk-js` directory in monorepo and of
//   the `sdk-js` repository
// * find the most recent pair of commits in these two repos with matching file
//   contents.
// * for any commit that touches `opensource/sdk-js` in monorepo *after* the
//   last time monorepo and sdk-js repo were in sync, it creates a matching
//   commits in a local branch called `opensource/sdk-js/export-commits`. That
//   branch is attached to the history of `sdk-js`, not monorepo. To be precise,
//   it branches of the most recent commit in `sdk-js` which was in sync with
//   monorepo. So, if there are any commits in monorepo that need exporting to
//   `sdk-js`, this branch will contain them. You should check whether these
//   commits (and their commit messages!) are safe to publish as opensource. You
//   can amend them locally, and when ready, push them to `sdk-js`. Typically,
//   you would only alter the commit messages. If you find you need to also
//   alter the file contents, you will need to land the same changes in
//   monorepo. After all, we want the repo and the directory in monorepo to be
//   in sync!
// * for any commit in the `sdk-js` repository, the script will create matching
//   commits on a local monorepo branch called
//   `opensource/sdk-js/import-commits`. If there any such commits, you can
//   either just create pull requests for each (e.g. using `spr diff --all` on
//   that branch), or you can squash them into one commit and have one PR for
//   the whole sync. At the end, you just want to have all these changes landed
//   so that the contents of monorepo and `sdk-js` repo are in sync.
//
// The script will tell you how many commits it created, if any, in the import
// and export branches.
//
// Obviously, the above explanation applies to any of our opensource
// repositories, not just `sdk-js`.
//
// The script takes one to three options:
// * `--name` is required and must be set to the name of the opensource
//   repository you want to sync. That name must also match the name of the
//   subdirectory in `opensource` in monorepo.
// * `--master-branch` is optional and can be set to the name of the default
//   branch in the opensource repository (defaults to master)
// * `--repo` is optional and will override the opensource repository name
//   if specified.  If not specified, it will default to name.

import { promises as fs } from 'fs';
import * as readline from 'readline';
import { spawn } from 'child_process';

import yargs from 'yargs';

const EMPTY_COMMIT = '0000000000000000000000000000000000000000';
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const filterOutCordPrefixedNames = (name: string) => !name.startsWith('CORD-');

const argv = yargs(process.argv.slice(2))
  .option('name', { type: 'string', demandOption: true })
  .option('master-branch', { type: 'string', default: 'master' })
  .option('repo', { type: 'string' })
  .strict()
  .help()
  .alias('help', 'h').argv;

async function main(
  name: string,
  masterBranch: string,
  repo: string | undefined,
) {
  // If the repo is not specified, let's default it to the name
  if (!repo) {
    repo = name;
  }
  const pathWithinMainRepo = `opensource/${name}`;

  // Make sure `pathWithinMainRepo` exists and is a directory
  if (
    !(await fs
      .stat(pathWithinMainRepo)
      .then((s) => s.isDirectory())
      .catch(() => false))
  ) {
    throw new Error(
      `'${pathWithinMainRepo}' does not exist or is not a directory`,
    );
  }

  // Create git remote, if it does not exist yet
  const gitRemoteName = `opensource-${repo}`;

  if (
    !(await getCommandOutput('git', ['remote']))
      .split('\n')
      .map((l) => l.trim())
      .includes(gitRemoteName)
  ) {
    // The git remote for the sub-repository is not registered yet.

    await runCommand(
      'git',
      'remote',
      'add',
      gitRemoteName,
      `git@github.com:getcord/${repo}`,
    );
  }

  // Fetch from that remote, so we have the opensource repositories history
  // available to work with
  await runCommand('git', 'fetch', gitRemoteName);

  // Get a list of monorepo and subrepo commits that need importing/exporting.
  // Both `monorepoCommits` and `subrepoCommits` are arrays of commit hashes.
  // The first item in each array is the last commit where monorepo and subrepo
  // contents match. Any further items need importing/exporting.
  const { monorepoCommits, subrepoCommits, monorepoTrees, subrepoTrees } =
    await findCommonBase(
      getMonorepoCommitsTouchingPath(pathWithinMainRepo),
      getSubrepoCommits(gitRemoteName, masterBranch),
    );

  if (monorepoCommits.length > 1) {
    // We need to export commits.
    console.log(
      `${monorepoCommits.length - 1} commit(s) need exporting into subrepo.`,
    );
    let newBranchCommit = subrepoCommits[0];
    for (const newMonorepoCommit of monorepoCommits.slice(1)) {
      // Get commit message and some meta data
      const [authorName, authorEmail, authorDate, ...lines] = (
        await getCommandOutput('git', [
          'log',
          '--format=%an%n%ae%n%aI%n%B',
          '-n',
          '1',
          newMonorepoCommit,
        ])
      )
        .trimRight()
        .split('\n');

      // Create new commit for the subrepo
      newBranchCommit = (
        await getCommandOutput(
          'git',
          [
            'commit-tree',
            '-p',
            newBranchCommit,
            '-m',
            prepareSubrepoMessage(lines.join('\n'), newMonorepoCommit),
            monorepoTrees.get(newMonorepoCommit)!,
          ],
          {
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
            GIT_AUTHOR_DATE: authorDate,
          },
        )
      ).trim();
    }

    // Create the "export-commits" branch
    const branchName = `opensource/${repo}/export-commits`;
    await runCommand('git', 'branch', '-f', branchName, newBranchCommit);
    await runCommand(
      'git',
      'branch',
      `--set-upstream-to=${gitRemoteName}/${masterBranch}`,
      branchName,
    );

    console.log(`Prepared new commits in branch '${branchName}'`);
  }

  if (subrepoCommits.length > 1) {
    // We need to import commits.
    console.log(
      `${subrepoCommits.length - 1} commit(s) need importing from subrepo.`,
    );

    // The `treeReplacer` replaces one subdirectory of a given tree with a
    // different tree.
    const treeReplacer = await makeTreeReplacer(monorepoCommits[0], [
      'opensource',
      name,
    ]);

    // Create new commit for monorepo
    let newBranchCommit = monorepoCommits[0];
    for (const newSubrepoCommit of subrepoCommits.slice(1)) {
      const [authorName, authorEmail, authorDate, ...lines] = (
        await getCommandOutput('git', [
          'log',
          '--format=%an%n%ae%n%aI%n%B',
          '-n',
          '1',
          newSubrepoCommit,
        ])
      )
        .trimRight()
        .split('\n');

      newBranchCommit = (
        await getCommandOutput(
          'git',
          [
            'commit-tree',
            '-p',
            newBranchCommit,
            '-m',
            lines.join('\n'),
            await treeReplacer(subrepoTrees.get(newSubrepoCommit)!),
          ],
          {
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
            GIT_AUTHOR_DATE: authorDate,
          },
        )
      ).trim();
    }

    // Create the "import-commits" branch
    const branchName = `opensource/${repo}/import-commits`;
    await runCommand('git', 'branch', '-f', branchName, newBranchCommit);

    console.log(`Prepared new commits in branch '${branchName}'`);
  }
}

/**
 * Return `[commitHash, treeHash]` tuples for commits in monorepo that touch the
 * given path.
 *
 * The trees returned have all files and directories whose name begins with
 * 'CORD-' filtered out.
 *
 * Consequently, commits that touch the given directory, but only
 * adds/removes/modifies files beginning with 'CORD-' (and files in directories
 * beginning with 'CORD-') are omitted.
 */
async function* getMonorepoCommitsTouchingPath(
  path: string,
): AsyncGenerator<[string, string], void> {
  let lastCommitHash: string | null = null;
  let lastTreeHash: string | null = null;

  // Iterate through all commits that touch `path`
  for await (const line of streamLinesFromCommand(
    'git',
    'log',
    '--format=tformat:%H',
    '--',
    path,
  )) {
    const commitHash = line.trim();
    if (commitHash) {
      // The `originalTreeish` is the git notation for `path` in the commit
      // `commitHash`.
      const originalTreeish = `${commitHash}:${path}`;

      // `filterTreeByBane` filters out the files and directories whose name
      // begin with 'CORD-'. It returnes either `originalTreeish` (if there was
      // nothing to filter out), or a tree hash.
      const filteredTreeish = await filterTreeByName(
        originalTreeish,
        filterOutCordPrefixedNames,
      );

      // `tree` is going to be the hash for the (filtered) tree. If
      // `filteredTreeish` is `originalTreeish`, we have to turn it into a tree
      // hash. Otherwise it's a hash already.
      const tree =
        filteredTreeish === originalTreeish
          ? (
              await getCommandOutput('git', [
                'rev-parse',
                `${commitHash}:${path}`,
              ])
            ).trim()
          : filteredTreeish;

      // If the previous commit we encountered had a different resulting tree,
      // then that commit contained actual changes to the path (even after
      // filtering out `CORD-`-prefixed files and directories). We can yield
      // this now.
      if (
        lastCommitHash !== null &&
        lastTreeHash !== null &&
        lastTreeHash !== tree
      ) {
        yield [lastCommitHash, lastTreeHash];
      }

      // Update `lastCommitHash` and `lastTreeHash` to the commit/tree we
      // encountered just now. We won't just yield it yet, because the next
      // commit we get may have the same tree, and then we want to skip this
      // one. The reason why we still have to skip commits at all here, is that
      // `git log` gives us a list of all commits touching `path`, but some of
      // those may only change files/directories prefixed with `CORD-`, and
      // since we filter those out, such commits would result in no changes. We
      // don't want to create empty commits, so we skip them.
      lastCommitHash = commitHash;
      lastTreeHash = tree;
    }
  }

  if (lastCommitHash !== null && lastTreeHash !== null) {
    // The last commit we encountered above is the first that ever touched `path`.

    if (lastTreeHash !== EMPTY_TREE) {
      // The tree is not empty after filtering, so this is a commit we want to
      // emit.
      yield [lastCommitHash, lastTreeHash];
    }

    // Finally, emit the empty tree, which represents the state before `path`
    // was added to monorepo.
    yield [`${lastCommitHash}~1`, EMPTY_TREE];
  } else {
    // We didn't find any commits at all, so let's just say the current state of
    // monorepo corresponds to `path` being empty.
    yield ['HEAD', EMPTY_TREE];
  }
}

async function* getSubrepoCommits(remote: string, branch: string) {
  for await (const line of streamLinesFromCommand(
    'git',
    'log',
    '--format=tformat:%H %T',
    `refs/remotes/${remote}/${branch}`,
  )) {
    const fields = line.trim().split(/\s+/);
    if (fields.length === 2) {
      yield fields as [string, string];
    }
  }
  yield [EMPTY_COMMIT, EMPTY_TREE] as const;
}

async function findCommonBase(
  monorepoCommitIter: AsyncGenerator<readonly [string, string]>,
  subrepoCommitIter: AsyncGenerator<readonly [string, string]>,
) {
  const commits: string[][] = [[], []];
  const treePositions: Map<string, number>[] = [new Map(), new Map()];
  const monorepoTrees = new Map<string, string>();
  const subrepoTrees = new Map<string, string>();

  for await (const [repoID, [commitID, treeID]] of zipIterators(
    monorepoCommitIter,
    subrepoCommitIter,
  )) {
    (repoID === 0 ? monorepoTrees : subrepoTrees).set(commitID, treeID);

    commits[repoID].push(commitID);

    const otherRepo = 1 - repoID;
    const treeInOtherRepo = treePositions[otherRepo].get(treeID);
    if (treeInOtherRepo !== undefined) {
      commits[otherRepo] = commits[otherRepo].slice(0, treeInOtherRepo + 1);
      break;
    }

    if (!treePositions[repoID].has(treeID)) {
      treePositions[repoID].set(treeID, commits[repoID].length - 1);
    }
  }

  return {
    monorepoCommits: commits[0].reverse(),
    subrepoCommits: commits[1].reverse(),
    monorepoTrees,
    subrepoTrees,
  };
}

async function makeTreeReplacer(
  treeish: string,
  path: string[],
): Promise<(treeID: string) => Promise<string>> {
  if (path.length === 0) {
    return (treeID: string) => Promise.resolve(treeID);
  }

  const path0 = path[0]!;
  let subtree = EMPTY_TREE;

  const lines: string[] = [];
  for await (const line of streamLinesFromCommand('git', 'ls-tree', treeish)) {
    const match = /^\d+ (\w+) (\w+)\t(.*?)$/.exec(line);
    if (match) {
      const [_, type, hash, name] = match;

      if (name === path0) {
        if (type === 'tree') {
          subtree = hash;
        }
      } else {
        lines.push(line);
      }
    }
  }

  const rest = lines.join('\n') + (lines.length ? '\n' : '');
  const innerReplacer = await makeTreeReplacer(subtree, path.slice(1));

  return async (treeID: string) => {
    const input = `${rest}040000 tree ${await innerReplacer(
      treeID,
    )}\t${path0}\n`;
    return (await getCommandOutput('git', ['mktree'], undefined, input)).trim();
  };
}

async function filterTreeByName(
  treeish: string,
  func: (name: string) => boolean,
) {
  let anyChanges = false;

  const lines: string[] = [];
  // Iterate through all items in the treeish.
  for await (const line of streamLinesFromCommand('git', 'ls-tree', treeish)) {
    const match = /^(\d+) (\w+) (\w+)\t(.*?)$/.exec(line);
    if (match) {
      const [_, stat, type, hash, name] = match;

      if (!func(name)) {
        // we filter out this entry
        anyChanges = true;
        continue;
      }

      if (type === 'tree') {
        // We have to descend this tree, too.

        const filteredHash = await filterTreeByName(hash, func);

        if (filteredHash !== hash) {
          // The filtering produced a change
          anyChanges = true;

          if (filteredHash !== EMPTY_TREE) {
            // The tree came back non-empty from filtering, so we add a line for
            // the tree after filtering.
            lines.push(`${stat} ${type} ${filteredHash}\t${name}`);
          }

          // Either way, we have dealt with this entry. We `continue` so we do
          // not push the original into the output array below.
          continue;
        }
      }

      // If we haven't `continue`d above, then we just add the line back unchanged
      lines.push(line);
    }
  }

  if (anyChanges) {
    const newTreeContent = lines.join('\n') + (lines.length ? '\n' : '');
    return (
      await getCommandOutput('git', ['mktree'], undefined, newTreeContent)
    ).trim();
  } else {
    // Nothing has changed, so we return the original treeish.
    return treeish;
  }
}

const privateSectionRegex = new RegExp(
  '^CORD PRIVATE SECTION START$.*?^CORD PRIVATE SECTION END(\\n|$)',
  // s = dotAll (. matches new lines)
  // m = multiline (^ and $ still match beginning and end of a line)
  // g = globally, more than one match (needed for .replaceAll())
  'smg',
);
function prepareSubrepoMessage(msg: string, monorepoCommitID: string) {
  msg = msg.replaceAll(privateSectionRegex, '');
  return `${msg.trimRight()}\n\nmonorepo-commit: ${monorepoCommitID}`;
}

function streamLinesFromCommand(cmd: string, ...args: string[]) {
  return readline.createInterface({
    input: spawn(cmd, args, {
      stdio: ['ignore', 'pipe', process.stderr],
    }).stdout,
  });
}

async function getCommandOutput(
  cmd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
  stdin?: string,
) {
  const fragments: string[] = [];

  const child = spawn(cmd, args, {
    stdio: [stdin === undefined ? 'ignore' : 'pipe', 'pipe', process.stderr],
    env: env ? { ...process.env, ...env } : undefined,
  });

  const finished = new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`exit code ${code}`)),
    );
  });

  if (stdin !== undefined && child.stdin) {
    const stream = child.stdin;
    stream.write(stdin, 'utf-8', () => stream.end());
  }

  if (child.stdout) {
    for await (const fragment of child.stdout) {
      fragments.push(fragment);
    }
  }

  await finished;
  return fragments.join('');
}

function runCommand(cmd: string, ...args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    proc.on('error', reject);
    proc.once('close', resolve);
  });
}

async function* zipIterators<T, U, V>(
  ...generators: AsyncGenerator<T, U, V>[]
) {
  const gens = [...generators.entries()];

  while (gens.length) {
    const [idx, gen] = gens.shift()!;

    const item = await gen.next();
    if (!item.done) {
      yield [idx, item.value] as const;
      gens.push([idx, gen]);
    }
  }
}

main(argv.name, argv['master-branch'], argv['repo']).then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
