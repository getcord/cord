import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { ApplicationMutator } from 'server/src/entity/application/ApplicationMutator.ts';
import { ApplicationEntityExample } from 'server/src/entity/application/tests/ApplicationEntityExample.ts';
import { S3BucketEntity } from 'server/src/entity/s3_bucket/S3BucketEntity.ts';
import type { S3BucketConfigWithCredentials } from 'server/src/files/upload.ts';
import { Viewer } from 'server/src/auth/index.ts';
import 'server/src/tests/setupEnvironment';

const viewer = Viewer.createServiceViewer();

describe('platform application', () => {
  test('working s3 bucket encryption', async () => {
    let application = await new ApplicationEntityExample().create({});

    // initially this should be null
    expect(application.customS3Bucket).toBeNull();

    const s3BucketConfig: S3BucketConfigWithCredentials = {
      region: 'eu-west-2',
      bucket: 'images',
      accessKeyID: '123',
      accessKeySecret: 'secret',
    };

    // set the s3 bucket config value to an object
    const updated = await new ApplicationMutator(viewer).setS3BucketConfig(
      application.id,
      s3BucketConfig,
    );
    expect(updated).toBeTruthy();
    application = (await ApplicationEntity.findByPk(
      application.id,
    )) as ApplicationEntity;
    // encrypted data should be there now
    expect(application.customS3Bucket).not.toBeNull();
    const bucket = await S3BucketEntity.findByPk(
      application.customS3Bucket ?? '',
    );
    expect(bucket).not.toBeNull();
    expect(bucket?.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT()).toEqual(
      s3BucketConfig,
    );

    // set the s3 bucket config value to null
    await new ApplicationMutator(viewer).setS3BucketConfig(
      application.id,
      undefined,
    );
    application = (await ApplicationEntity.findByPk(
      application.id,
    )) as ApplicationEntity;

    // data is no longer there
    expect(application.customS3Bucket).toBeNull();
  });

  test('broken bucket encrypted value', async () => {
    const bucket = await S3BucketEntity.create({
      name: 'test app',
      region: 'eu-bla-42',
      accessKeyID: 'yolo',
      accessKeySecret: 'totally-not-a-valid-encrypted-value',
    });

    expect(() => bucket.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT()).toThrow(
      'The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined',
    );
  });

  test('broken iv value in bucket encrypted value', async () => {
    const bucket = await S3BucketEntity.create({
      name: 'test app',
      region: 'eu-bla-42',
      accessKeyID: 'yolo',
      accessKeySecret: 'maybe-valid-encrypted-value:but:not-really',
    });

    expect(() => bucket.getS3BucketConfig_DO_NOT_EXPOSE_TO_CLIENT()).toThrow();
  });
});
