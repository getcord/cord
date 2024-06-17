import gql from 'graphql-tag';
import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

let org: OrgEntity;
let user: UserEntity;

async function queryUserAndOrg(viewer: Viewer): Promise<{
  user: { id: UUID };
  organization: { id: UUID } | null;
}> {
  const result = await executeGraphQLOperation({
    query: gql.default`
      query {
        viewer {
          user {
            id
          }
          organization {
            id
          }
        }
      }
    `,
    variables: {},
    viewer,
  });

  expect(result.data).toBeDefined();
  return result.data!.viewer;
}

describe('Test viewer query', () => {
  beforeAll(async () => {
    const application = await createPlatformApplication();
    org = await createRandomPlatformOrg(application.id);
    user = await createRandomPlatformUserAndOrgMember(application.id, org.id);
  });

  test('Check default user and org', async () => {
    const viewer = await Viewer.createLoggedInPlatformViewer({ user, org });
    const result = await queryUserAndOrg(viewer);
    expect(result.user.id).toBe(user.id);
    expect(result.organization?.id).toBe(org.id);
  });

  test('Check user and org without org in token', async () => {
    const viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org: null,
    });
    const result = await queryUserAndOrg(viewer);
    expect(result.user.id).toBe(user.id);
    expect(result.organization).toBeNull();
  });

  test('Check user and org without org in token and not member of any orgs', async () => {
    await OrgMembersEntity.truncate();

    const viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org: null,
    });
    const result = await queryUserAndOrg(viewer);
    expect(result.user.id).toBe(user.id);
    expect(result.organization).toBeNull();
  });
});
