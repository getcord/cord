import * as jsonwebtoken from 'jsonwebtoken';
import type supertest from 'supertest';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { createRandomPlatformUserAndOrgMember } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { isDefined } from 'common/util/index.ts';
import type { Location, UserLocationData } from '@cord-sdk/types';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  getAllUserPresence,
  removeUserPresence,
} from 'server/src/presence/context.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';

let application: ApplicationEntity;
let organization: OrgEntity;
let clientAuthToken: string;
let serverAuthToken: string;
let andreiUser: UserEntity;
let otherUser: UserEntity;

async function makeApiCall(
  location: Location,
  excludeDurable?: boolean,
  partialMatch?: boolean,
): Promise<supertest.Test> {
  let queryParams = `location=${encodeURIComponent(JSON.stringify(location))}`;
  if (isDefined(excludeDurable)) {
    queryParams += `&exclude_durable=${excludeDurable}`;
  }
  if (isDefined(partialMatch)) {
    queryParams += `&partial_match=${partialMatch}`;
  }
  return await apiCall()
    .get(`/v1/client/presence?${queryParams}`)
    .set('Authorization', `Bearer ${clientAuthToken}`);
}

async function setUserPresent(
  user: UserEntity,
  location: Location,
  durable: boolean,
) {
  await apiCall()
    .put(`/v1/users/${user.externalID}/presence`)
    .set('Authorization', `Bearer ${serverAuthToken}`)
    .send({
      location,
      durable,
      groupID: organization.externalID,
    });
}

function sortByID(data: UserLocationData[]) {
  data.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    }
    return 0;
  });
}

describe('Platform list users API: /v1/client/user', () => {
  beforeAll(async () => {
    ({ application, organization, andreiUser } = await setupPlatformTest());

    otherUser = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );

    serverAuthToken = jsonwebtoken.sign(
      { project_id: application.id },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  afterEach(async () => {
    const allPresence = await getAllUserPresence(organization.id);
    await Promise.all(
      [...allPresence.entries()].flatMap(([userID, locations]) =>
        locations.map((location) =>
          removeUserPresence(userID, organization.id, location, location),
        ),
      ),
    );
    await PageVisitorEntity.truncate();
  });

  test('Empty', async () => {
    const { statusCode, body } = await makeApiCall({});

    expect(statusCode).toBe(200);
    expect(body).toEqual([]);
  });

  test('Ephemeral', async () => {
    await setUserPresent(andreiUser, { test: 'ephemeral' }, false);

    const { statusCode, body } = await makeApiCall({ test: 'ephemeral' });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject([
      {
        id: andreiUser.externalID,
        ephemeral: { locations: [{ test: 'ephemeral' }] },
      },
    ]);
  });

  test('Durable', async () => {
    await setUserPresent(andreiUser, { test: 'durable' }, true);

    const { statusCode, body } = await makeApiCall({ test: 'durable' });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject([
      {
        id: andreiUser.externalID,
        ephemeral: { locations: [] },
        durable: { location: { test: 'durable' } },
      },
    ]);
  });

  test('Partial match', async () => {
    await setUserPresent(andreiUser, { test: 'partial', part: 1 }, false);
    await setUserPresent(andreiUser, { test: 'partial', part: 2 }, false);
    await setUserPresent(andreiUser, { not: 'matching' }, false);

    const { statusCode, body } = await makeApiCall(
      { test: 'partial' },
      undefined,
      true,
    );
    expect(statusCode).toBe(200);
    expect(body).toMatchObject([
      {
        id: andreiUser.externalID,
        ephemeral: {
          locations: [
            { test: 'partial', part: 1 },
            { test: 'partial', part: 2 },
          ],
        },
      },
    ]);
  });

  test('Multiple users', async () => {
    await setUserPresent(andreiUser, { test: 'multiple', part: 1 }, false);
    await setUserPresent(andreiUser, { test: 'multiple', part: 2 }, false);
    await setUserPresent(
      otherUser,
      { test: 'multiple', another: 'thing' },
      false,
    );
    await setUserPresent(
      otherUser,
      { test: 'multiple', another: 'test' },
      true,
    );

    const { statusCode, body } = await makeApiCall(
      { test: 'multiple' },
      undefined,
      true,
    );
    sortByID(body);
    expect(statusCode).toBe(200);
    expect(body).toMatchObject([
      {
        id: andreiUser.externalID,
        ephemeral: {
          locations: [
            { test: 'multiple', part: 1 },
            { test: 'multiple', part: 2 },
          ],
        },
      },
      {
        id: otherUser.externalID,
        ephemeral: {
          locations: [{ test: 'multiple', another: 'thing' }],
        },
        durable: {
          location: { test: 'multiple', another: 'test' },
        },
      },
    ]);
  });
});
