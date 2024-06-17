import type { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { DemoUser } from 'server/src/public/routes/warm-demo-users/types.ts';
import * as HomepageDemoUser from 'server/src/public/routes/warm-demo-users/HomepageDemoUser.ts';
import { getClientAuthToken } from '@cord-sdk/server';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { WarmDemoUserEntity } from 'server/src/entity/demo/WarmDemoUserEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

// This file contains a handler to manage a pool of demo users, deliver them to
// people looking for them, and refill the pool.  This can be used for any
// use case we have for temporary demo users.

type DemoUserFactory = {
  create: () => Promise<DemoUser>;
  reheat: (req: Request, user: DemoUser, token: string) => Promise<unknown>;
  numToKeep: number;
  version: number;
};

const DEMO_USER_TYPES = {
  homepage: HomepageDemoUser,
} as const satisfies Record<string, DemoUserFactory>;

type DemoUserType = keyof typeof DEMO_USER_TYPES;

async function findUser(type: DemoUserType) {
  try {
    // This query atomically finds and deletes one row from the warm_demo_users
    // table, to ensure we don't vend the same warm user to multiple people who
    // arrive.  The `FOR UPDATE` in the select tells Postgres to lock that row
    // when it selects it so that nobody else can get it, and it will stay
    // locked until the query finishes (at which point it will be deleted).  The
    // `SKIP LOCKED` tells other queries to not consider locked rows and just
    // try to return some unlocked row, so they won't block if multiples of this
    // query run concurrently.

    // See https://shekhargulati.com/2022/01/27/correctly-using-postgres-as-queue/
    const result = await getSequelize().query(
      `DELETE FROM warm_demo_users
       WHERE id IN (
         SELECT id FROM warm_demo_users WHERE "demoGroup" = $1 AND version = $2
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
     RETURNING *`,
      {
        type: QueryTypes.SELECT,
        bind: [type, DEMO_USER_TYPES[type].version],
        model: WarmDemoUserEntity,
      },
    );
    if (result.length > 0) {
      return result[0];
    }
  } catch (err) {
    anonymousLogger().logException(
      'Failed to execute demo user find query',
      err,
      {
        type,
      },
    );
  }
  return null;
}

function isValidType(type: any): type is DemoUserType {
  return type && type in DEMO_USER_TYPES;
}

async function refill(type: DemoUserType) {
  const num = await WarmDemoUserEntity.count({
    where: { demoGroup: type },
  });
  const typeInfo = DEMO_USER_TYPES[type];
  const promises = [];
  for (let i = num; i < typeInfo.numToKeep; i++) {
    promises.push(
      (async () => {
        const newUser = await typeInfo.create();
        await WarmDemoUserEntity.create({
          platformApplicationID: newUser.appID,
          userID: newUser.userID,
          orgID: newUser.orgID,
          demoGroup: type,
          version: typeInfo.version,
        });
      })(),
    );
  }
  return await Promise.all(promises);
}

async function getDemoToken(req: Request, res: Response) {
  const type = req.query.type;
  if (!isValidType(type)) {
    res.status(404);
    return;
  }

  const typeInfo = DEMO_USER_TYPES[type];

  const user = await findUser(type);

  let demoUser: DemoUser;
  if (user) {
    demoUser = {
      appID: user.platformApplicationID,
      userID: user.userID,
      orgID: user.orgID,
    };
  } else {
    try {
      demoUser = await typeInfo.create();
    } catch (err) {
      anonymousLogger().logException('Failed to create demo user', err, {
        type,
      });
      throw err;
    }
  }

  const app = await ApplicationEntity.findByPk(demoUser.appID);
  if (!app) {
    res.status(404);
    return;
  }

  const clientAuthToken = getClientAuthToken(demoUser.appID, app.sharedSecret, {
    user_id: demoUser.userID,
    organization_id: demoUser.orgID,
  });

  backgroundPromise(refill(type));
  res.json(await typeInfo.reheat(req, demoUser, clientAuthToken));
}

export default forwardHandlerExceptionsToNext(getDemoToken);
