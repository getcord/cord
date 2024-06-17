#!/usr/bin/env node

import * as child_process from 'child_process';
import { promises as fs } from 'fs';

import * as iam from '@aws-sdk/client-iam';

import { AWS_REGION } from 'ops/aws/src/radical-stack/Config.ts';

const MIN_UID = 1000;
const MAX_UID = 9999;

async function main() {
  const sshKeysByName = await getUserSSHKeys();
  const homeDirs = await getExistingHomeDirs();
  const [uidByName, nameByUid] = await getExistingUsers();

  let maxUid = Math.max(
    MIN_UID,
    ...[...homeDirs.values(), ...uidByName.values()].filter(
      (uid) => uid <= MAX_UID,
    ),
  );

  // If there is an existing home directory, but no user with that name and no
  // user with the directory-owning uid exist, than we create this user on this
  // system. Also, the owning uid must be in the valid range or we skip this
  // directory.
  for (const [name, uid] of homeDirs) {
    if (
      !uidByName.has(name) &&
      !nameByUid.has(uid) &&
      uid >= MIN_UID &&
      uid <= MAX_UID
    ) {
      await run('/usr/sbin/adduser', [
        '--disabled-password',
        '--home',
        `/home/${name}`,
        '--no-create-home',
        '--uid',
        `${uid}`,
        '--gecos',
        '',
        name,
      ]);

      uidByName.set(name, uid);
      nameByUid.set(uid, name);

      // Add the new user to the 'docker' group
      await run('/usr/sbin/adduser', [name, 'docker']).catch(console.error);
    }
  }

  // If there are SSH keys defined for an AWS user, and no local user with that
  // same name exists, and no home directory by that name either, we'll create
  // that user.
  for (const name of sshKeysByName.keys()) {
    if (!homeDirs.has(name) && !uidByName.has(name)) {
      const uid = ++maxUid;

      await run('/usr/sbin/adduser', [
        '--disabled-password',
        '--home',
        `/home/${name}`,
        '--uid',
        `${uid}`,
        '--gecos',
        '',
        name,
      ]);

      homeDirs.set(name, uid);
      uidByName.set(name, uid);
      nameByUid.set(uid, name);

      // Add the new user to the 'docker' group
      await run('/usr/sbin/adduser', [name, 'docker']).catch(console.error);
    }
  }

  // Go into every directory in home and write the authorized_keys file
  for (const [name, uid] of homeDirs) {
    const sshKeys = sshKeysByName.get(name);

    // If we have keys, and this home directory is owned by an existing user
    // (whose uid is the one the home directory is owned by and its within the
    // valid range), then we install the keys. Otherwise, we remove the
    // authorized_keys file (if one exists).
    const installKeys =
      sshKeys &&
      sshKeys.length &&
      nameByUid.get(uid) === name &&
      uid >= MIN_UID &&
      uid <= MAX_UID;
    const sshDir = `/home/${name}/.ssh`;
    const authorizedKeysFile = `${sshDir}/authorized_keys`;

    if (installKeys) {
      await fs.mkdir(sshDir).then(
        () => fs.chown(sshDir, uid, uid),
        (err) => (err.code === 'EEXIST' ? undefined : Promise.reject(err)),
      );

      await fs.writeFile(authorizedKeysFile, sshKeys.join('\n'), {
        encoding: 'utf-8',
      });
      await fs.chown(authorizedKeysFile, uid, uid);
    } else {
      await fs
        .unlink(authorizedKeysFile)
        .catch((err) =>
          err.code === 'ENOENT' ? undefined : Promise.reject(err),
        );
    }
  }
}

async function getUserSSHKeys() {
  const client = new iam.IAMClient({
    region: AWS_REGION,
  });

  const userMap = new Map();

  for await (const page of iam.paginateListUsers({ client }, {})) {
    if (!page.Users) {
      continue;
    }

    for (const { UserName } of page.Users) {
      const info = await client.send(new iam.GetUserCommand({ UserName }));

      const zeroAccount =
        info.User &&
        info.User.Tags &&
        info.User.Tags.some(
          (t) => t.Key === 'zeroAccount' && t.Value === 'yes',
        );

      if (!zeroAccount) {
        continue;
      }

      const keyIDs = [];
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      for await (const page of iam.paginateListSSHPublicKeys(
        { client },
        { UserName },
      )) {
        keyIDs.push(
          ...(page.SSHPublicKeys ?? []).map(
            ({ SSHPublicKeyId }) => SSHPublicKeyId,
          ),
        );
      }

      const keys = (
        await Promise.all(
          keyIDs.map((SSHPublicKeyId) =>
            client.send(
              new iam.GetSSHPublicKeyCommand({
                UserName,
                SSHPublicKeyId,
                Encoding: 'SSH',
              }),
            ),
          ),
        )
      )
        .map(({ SSHPublicKey }) => SSHPublicKey)
        .filter((x: iam.SSHPublicKey | undefined): x is iam.SSHPublicKey => !!x)
        .filter(({ Status }) => Status === 'Active')
        .map(({ SSHPublicKeyBody }) => SSHPublicKeyBody);

      userMap.set(UserName, keys);
    }
  }

  return userMap;
}

async function getExistingHomeDirs() {
  const map = new Map();

  for (const name of await fs.readdir('/home')) {
    const stat = await fs.lstat(`/home/${name}`);

    if (stat.isDirectory()) {
      map.set(name, stat.uid);
    }
  }

  return map;
}

async function getExistingUsers() {
  const uidByName = new Map();
  const nameByUid = new Map();

  for (const line of (await fs.readFile('/etc/passwd', { encoding: 'utf-8' }))
    .split('\n')
    .filter(Boolean)) {
    const [name, _, uidString] = line.split(':');
    const uid = parseInt(uidString);

    if (name && uid >= 0) {
      uidByName.set(name, uid);
      nameByUid.set(uid, name);
    }
  }
  return [uidByName, nameByUid];
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = child_process.spawn(cmd, args);
    proc.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited with code ${code}`)),
    );
  });
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
