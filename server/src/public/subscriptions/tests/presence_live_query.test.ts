import { Viewer } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';

import type { Location } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  clearTimeoutsForTest,
  getAllUserPresence,
  removeUserPresence,
} from 'server/src/presence/context.ts';
import { setUserPresentContext } from 'server/src/presence/utils.ts';
import { presenceLiveQueryResolver } from 'server/src/public/subscriptions/presence_live_query.ts';
import type { PresenceLiveQueryData } from 'server/src/schema/resolverTypes.ts';

const TIMEOUT = Symbol('TIMEOUT');
type Timeout = typeof TIMEOUT;

async function withTimeout<T>(
  p: Promise<T>,
  timeoutMs: number,
): Promise<T | Timeout> {
  let timer: NodeJS.Timeout;
  return await Promise.race([
    p,
    new Promise<Timeout>((resolve) => {
      timer = setTimeout(() => resolve(TIMEOUT), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

let viewer: Viewer;
let application: ApplicationEntity;
let org: OrgEntity;
let user: UserEntity;
let userRequestContext: RequestContext;

async function createIterator({
  matcher = {},
  excludeDurable = false,
  exactMatch = false,
  requestContext = userRequestContext,
}: {
  matcher?: Location;
  excludeDurable?: boolean;
  exactMatch?: boolean;
  requestContext?: RequestContext;
}): Promise<AsyncIterator<PresenceLiveQueryData>> {
  return (
    await presenceLiveQueryResolver.subscribe(
      {},
      {
        input: { matcher, excludeDurable, exactMatch },
        _externalOrgID: undefined,
      },
      requestContext,
    )
  )[Symbol.asyncIterator]();
}

async function setPresent(
  location: Location,
  durable = false,
  requestContext = userRequestContext,
) {
  await setUserPresentContext({
    userContext: location,
    exclusivityRegion: location,
    present: true,
    durable,
    context: requestContext,
  });
}

async function removePresence(
  location: Location,
  requestContext = userRequestContext,
) {
  await setUserPresentContext({
    userContext: location,
    exclusivityRegion: location,
    present: false,
    durable: false,
    context: requestContext,
  });
}

describe('presenceLiveQuery', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    org = await createRandomPlatformOrg(application.id);
    user = await createRandomPlatformUserAndOrgMember(application.id, org.id);

    viewer = await Viewer.createLoggedInPlatformViewer({ user, org });
    userRequestContext = await contextWithSession(
      { viewer },
      getSequelize(),
      null,
      null,
    );
  });

  afterEach(async () => {
    clearTimeoutsForTest();
    const allPresence = await getAllUserPresence(org.id);
    await Promise.all(
      [...allPresence.entries()].flatMap(([userID, locations]) =>
        locations.map((location) =>
          removeUserPresence(userID, org.id, location, location),
        ),
      ),
    );
    await PageVisitorEntity.truncate();
  });

  test('User arrives - ephemeral', async () => {
    const iterator = await createIterator({});
    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [],
    });

    await setPresent({ foo: 'bar' });

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar' }],
          },
        },
      ],
    });
  });

  test('User arrives - durable', async () => {
    const iterator = await createIterator({});
    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [],
    });

    await setPresent({ foo: 'bar' }, true);

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          durable: {
            context: { foo: 'bar' },
          },
        },
      ],
    });
  });

  test('User leaves - ephemeral', async () => {
    const iterator = await createIterator({});

    await setPresent({ foo: 'bar' });

    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar' }],
          },
        },
      ],
    });

    await removePresence({ foo: 'bar' });

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: null,
          },
        },
      ],
    });
  });

  test('excludeDurable', async () => {
    await setPresent({ foo: 'bar' }, true);

    const iterator = await createIterator({ excludeDurable: true });
    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [],
    });

    // This update should be ignored
    await setPresent({ bar: 'baz' }, true);

    // We expect to have no updates pending
    const pending = iterator.next();
    expect(await withTimeout(pending, 10)).toEqual(TIMEOUT);

    await setPresent({ foo: 'foo2' });

    expect((await pending).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'foo2' }],
          },
        },
      ],
    });
  });

  test('Matcher filtering', async () => {
    const iterator = await createIterator({ matcher: { foo: 'bar' } });

    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [],
    });

    // These two should be ignored
    await setPresent({ foo: 'baz' });
    await setPresent({ foo: 'barbar' }, true);

    // We expect to have no updates pending
    const pending = iterator.next();
    expect(await withTimeout(pending, 10)).toEqual(TIMEOUT);

    // This one should generate an update
    await setPresent({ foo: 'bar', bar: 'baz' });

    expect((await pending).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar', bar: 'baz' }],
          },
        },
      ],
    });
  });

  test('Multiple locations generates an update with all locations', async () => {
    const iterator = await createIterator({});

    expect((await iterator.next()).value).toMatchObject({
      complete: true,
      data: [],
    });

    await setPresent({ foo: 'bar' });

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar' }],
          },
        },
      ],
    });

    await setPresent({ baz: 'quux' });

    // Multiple locations can be in any order, so we compare the sets
    const nextValue = (await iterator.next()).value;
    expect(nextValue).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {},
        },
      ],
    });
    expect(new Set(nextValue.data[0].ephemeral.contexts)).toEqual(
      new Set([{ foo: 'bar' }, { baz: 'quux' }]),
    );
  });

  test('Removing one of multiple locations', async () => {
    await setPresent({ foo: 'bar' });
    await setPresent({ baz: 'quux' });

    const iterator = await createIterator({});

    // Multiple locations can be in any order, so we compare the sets
    const nextValue = (await iterator.next()).value;
    expect(nextValue).toMatchObject({
      complete: true,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {},
        },
      ],
    });
    expect(new Set(nextValue.data[0].ephemeral.contexts)).toEqual(
      new Set([{ foo: 'bar' }, { baz: 'quux' }]),
    );

    await removePresence({ foo: 'bar' });

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ baz: 'quux' }],
          },
        },
      ],
    });
  });

  test('Multiple users', async () => {
    const user2 = await createRandomPlatformUserAndOrgMember(
      application.id,
      org.id,
    );
    const user2RequestContext = await contextWithSession(
      {
        viewer: await Viewer.createLoggedInPlatformViewer({ user: user2, org }),
      },
      getSequelize(),
      null,
      null,
    );
    await setPresent({ foo: 'bar' }, false, userRequestContext);
    await setPresent({ foo: 'bar' }, false, user2RequestContext);

    const iterator = await createIterator({});

    const nextValue = (await iterator.next()).value;

    expect(nextValue.complete).toEqual(true);
    expect(nextValue.data).toHaveLength(2);
    expect(nextValue.data).toEqual(
      expect.arrayContaining([
        {
          externalUserID: user.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar' }],
          },
        },
        {
          externalUserID: user2.externalID,
          ephemeral: {
            contexts: [{ foo: 'bar' }],
          },
        },
      ]),
    );

    await removePresence({ foo: 'bar' }, user2RequestContext);

    expect((await iterator.next()).value).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user2.externalID,
          ephemeral: {
            contexts: null,
          },
        },
      ],
    });
  });

  test('Multiple orgs', async () => {
    // Create a second org that will have presence records
    const org2 = await createRandomPlatformOrg(application.id);

    await OrgMembersEntity.findOrCreate({
      where: {
        userID: user.id,
        orgID: org2.id,
      },
      defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
    });

    // Create a third org that never has any presence records
    const org3 = await createRandomPlatformOrg(application.id);

    await OrgMembersEntity.findOrCreate({
      where: {
        userID: user.id,
        orgID: org3.id,
      },
      defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
    });

    const org2RequestContext = await contextWithSession(
      {
        viewer: await Viewer.createLoggedInPlatformViewer({ user, org: org2 }),
      },
      getSequelize(),
      null,
      null,
    );

    await setPresent({ foo: 'bar' }, false, userRequestContext);
    await setPresent({ foo: 'baz' }, false, org2RequestContext);

    // Query the iterator using a viewer with no org set so it works across orgs
    const iterator = await createIterator({
      requestContext: await contextWithSession(
        {
          viewer: await Viewer.createLoggedInPlatformViewer({
            user,
            org: null,
          }),
        },
        getSequelize(),
        null,
        null,
      ),
    });

    // Multiple locations can be in any order, so we compare the sets
    let nextValue = (await iterator.next()).value;
    expect(nextValue).toMatchObject({
      complete: true,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {},
        },
      ],
    });
    expect(new Set(nextValue.data[0].ephemeral.contexts)).toEqual(
      new Set([{ foo: 'bar' }, { foo: 'baz' }]),
    );

    await setPresent({ foo: 'blast' }, false, org2RequestContext);

    nextValue = (await iterator.next()).value;
    expect(nextValue).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {},
        },
      ],
    });
    expect(new Set(nextValue.data[0].ephemeral.contexts)).toEqual(
      new Set([{ foo: 'bar' }, { foo: 'baz' }, { foo: 'blast' }]),
    );

    await removePresence({ foo: 'bar' }, userRequestContext);

    nextValue = (await iterator.next()).value;
    expect(nextValue).toMatchObject({
      complete: false,
      data: [
        {
          externalUserID: user.externalID,
          ephemeral: {},
        },
      ],
    });
    expect(new Set(nextValue.data[0].ephemeral.contexts)).toEqual(
      new Set([{ foo: 'baz' }, { foo: 'blast' }]),
    );

    // Clean up presence so it doesn't pollute other tests
    await removePresence({ foo: 'baz' }, org2RequestContext);
    await removePresence({ foo: 'blast' }, org2RequestContext);
  });
});
