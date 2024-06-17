#!/usr/bin/env -S node --enable-source-maps

import 'dotenv/config.js';
import yargs from 'yargs';
import type { CreationAttributes } from 'sequelize';
import { Op } from 'sequelize';
import { getSequelize, initSequelize } from 'server/src/entity/sequelize.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { assertUUID } from 'common/util/index.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';

const FAKE_USER_ID_PREFIX = 'UFAKEFAKEFAKE-';

function zeropad(n: number): string {
  return n.toString().padStart(8, '0');
}

function fakeUser(
  n: number,
  platformApplicationID: UUID,
): CreationAttributes<UserEntity> {
  return {
    externalID: `${FAKE_USER_ID_PREFIX}${zeropad(n)}`,
    platformApplicationID,
    externalProvider: AuthProviderType.PLATFORM,
    email: `fakeuser@cord.com`,
    name: `Fake User ${n}`,
    nameUpdatedTimestamp: new Date(),
    profilePictureURL:
      'https://upload.wikimedia.org/wikipedia/commons/d/d9/Icon-round-Question_mark.svg',
  };
}

async function maxUserNum(): Promise<number> {
  const highestUser = await UserEntity.findOne({
    where: { externalID: { [Op.like]: `${FAKE_USER_ID_PREFIX}%` } },
    order: [['externalID', 'DESC']],
  });
  if (!highestUser?.externalID) {
    return 0;
  }
  return parseInt(highestUser.externalID.slice(FAKE_USER_ID_PREFIX.length));
}

async function createUsers(num: number, orgID: string) {
  const org = await OrgEntity.findByPk(orgID);
  if (!org) {
    throw new Error(`Cannot find org with ID ${orgID}`);
  }
  if (!org.platformApplicationID) {
    throw new Error('Org does not have platformApplicationID');
  }
  const maxUser = await maxUserNum();
  const newUsers: CreationAttributes<UserEntity>[] = [];
  for (let i = maxUser + 1; i <= maxUser + num; i++) {
    newUsers.push(fakeUser(i, org.platformApplicationID));
  }
  await getSequelize().transaction(async (transaction) => {
    const userEntities = await new UserMutator(
      Viewer.createServiceViewer(),
      null,
    ).rawBulkCreate(newUsers, transaction);

    await OrgMembersEntity.bulkCreate(
      userEntities.map((user) => ({
        userID: user.id,
        orgID: org.id,
      })),
      { transaction },
    );
  });
  console.log(`Created ${num} fake users, now ${maxUser + num} total`);
}

async function deleteUsers(num: number) {
  const maxUser = await maxUserNum();
  if (num > maxUser) {
    throw new Error(
      `Can't delete ${num} users, only ${maxUser} fake users found`,
    );
  }

  const toDelete = await UserEntity.findAll({
    where: {
      externalID: {
        [Op.like]: `${FAKE_USER_ID_PREFIX}%`,
        [Op.gt]: `${FAKE_USER_ID_PREFIX}${zeropad(maxUser - num)}`,
      },
    },
  });
  if (toDelete.length !== num) {
    throw new Error(
      `Something weird is going on, tried to delete ${num} users but only found ${toDelete.length}`,
    );
  }

  const ids = toDelete.map((p) => p.id);

  await getSequelize().transaction(async (transaction) => {
    await OrgMembersEntity.destroy({
      where: { userID: ids },
      transaction,
    });
    await UserEntity.destroy({
      where: { id: ids },
      transaction,
    });
  });
  console.log(`Deleted ${num} fake users, now ${maxUser - num} total`);
}

async function main() {
  await initSequelize('script');

  await yargs(process.argv.slice(2))
    .command(
      'create orgID [n]',
      'create test users',
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (yargs) => {
        yargs
          .positional('orgID', {
            describe: 'orgID of containing org',
            type: 'string',
          })
          .positional('n', {
            describe: 'number of users to create',
            type: 'number',
            default: 1,
          })
          .check((argv) => {
            assertUUID(argv.orgID ?? '');
            return true;
          });
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      async (argv: any) => {
        await createUsers(argv.n, argv.orgID);
      },
    )
    .command(
      'delete [n]',
      'delete test users',
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (yargs) => {
        yargs.positional('n', {
          describe: 'number of users to delete',
          type: 'number',
          default: 1,
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      async (argv: any) => {
        await deleteUsers(argv.n);
      },
    )
    .command('count', 'count test users', async (_) => {
      console.log(`Found ${await maxUserNum()} fake users`);
    })
    .showHelpOnFail(false)
    .demandCommand()
    .parse();
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
