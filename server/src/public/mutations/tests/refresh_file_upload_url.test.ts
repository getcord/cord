import { v4 as uuid } from 'uuid';
import { Viewer } from 'server/src/auth/index.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import {
  RefreshFileUploadURLMutation,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';
import { MAX_UPLOAD_SIZE } from 'common/uploads/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

let application: ApplicationEntity;
let viewer: Viewer;
let user: UserEntity;
let org: OrgEntity;
let file: FileEntity;

beforeAll(async () => {
  application = await createPlatformApplication();
  org = await createRandomPlatformOrg(application.id);
  user = await createRandomPlatformUserAndOrgMember(application.id, org.id);
  viewer = Viewer.createLoggedInViewer(user.id, org.id);
});

beforeEach(async () => {
  file = await FileEntity.create({
    id: uuid(),
    userID: user.id,
    platformApplicationID: application.id,
    name: 'test.jpg',
    mimeType: 'image/jpeg',
    size: 0,
    uploadStatus: 'uploading',
  });
});

test('Can update size', async () => {
  const result = await executeGraphQLOperation({
    query: RefreshFileUploadURLMutation,
    variables: {
      id: file.id,
      size: 12345,
    },
    viewer,
  });

  expect(result.data?.refreshFileUploadURL).toBeTruthy();
  expect(result.data?.refreshFileUploadURL).toMatch(/https:\/\//);
  expect((await FileEntity.findByPk(file.id))?.size).toBe(12345);
});

test('Reject too large sizes', async () => {
  const result = await executeGraphQLOperation({
    query: RefreshFileUploadURLMutation,
    variables: {
      id: file.id,
      size: MAX_UPLOAD_SIZE + 1,
    },
    viewer,
  });

  expect(result.errors).toHaveLength(1);
  expect((await FileEntity.findByPk(file.id))?.size).toBe(0);
});

test("Cannot update other users' files", async () => {
  const otherUser = await createRandomPlatformUserAndOrgMember(
    application.id,
    org.id,
  );
  const result = await executeGraphQLOperation({
    query: RefreshFileUploadURLMutation,
    variables: {
      id: file.id,
      size: 12345,
    },
    viewer: Viewer.createLoggedInViewer(otherUser.id, org.id),
  });

  expect(result.errors).toHaveLength(1);
  expect((await FileEntity.findByPk(file.id))?.size).toBe(0);
});
