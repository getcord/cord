import { v4 as uuid } from 'uuid';
import type { UUID } from 'common/types/index.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';

import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS } from 'common/const/Api.ts';

let applicationID: UUID;
let orgID: UUID;
let userLoader: UserLoader;

async function createUserAndAddToOrg(
  name: string | undefined,
  screenName: string | undefined,
) {
  await createUserAndOrgMember({
    name,
    appID: applicationID,
    orgID,
    externalProvider: AuthProviderType.PLATFORM,
    email: '',
    externalID: uuid(),
    screenName,
  });
}

describe('Test loadNameFilteredUsersInOrg on user James Bond', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    applicationID = application.id;
    const org = await createRandomPlatformOrg(application.id);
    orgID = org.id;

    const viewerUser = await createRandomPlatformUserAndOrgMember(
      applicationID,
      orgID,
    );
    const viewer = await Viewer.createLoggedInPlatformViewer({
      user: viewerUser,
      org,
    });

    userLoader = new UserLoader(viewer, () => null);

    const names = [
      { name: 'James Bond', screenName: undefined },
      { name: 'James Dean', screenName: undefined },
      { name: undefined, screenName: 'Doctor No' },
    ];

    await Promise.all(
      names.map(({ name, screenName }) =>
        createUserAndAddToOrg(name, screenName),
      ),
    );
  });

  test('Matches James', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'James',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );

    expect(searchResults.length).toBe(2);

    const nameResults = searchResults.map(({ name }) => name);

    expect(nameResults).toContain('James Bond');
    expect(nameResults).toContain('James Dean');
  });

  test('Matches james', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'james',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(2);

    const nameResults = searchResults.map(({ name }) => name);

    expect(nameResults).toContain('James Bond');
    expect(nameResults).toContain('James Dean');
  });

  test('Matches James B', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'James B',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe('James Bond');
  });

  test('Matches Bond Jam', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'Bond Jam',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe('James Bond');
  });

  test('Does not match James Wond', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'James Wond',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(0);
  });

  test('Does not match ames', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'ames',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(0);
  });

  test('Matches from screenName', async () => {
    const searchResults = await userLoader.loadNameFilteredUsersInOrg(
      orgID,
      'doctor no',
      applicationID,
      MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].screenName).toBe('Doctor No');
  });
});
