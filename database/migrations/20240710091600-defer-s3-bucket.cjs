'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_customS3Bucket_fkey";

      ALTER TABLE "cord"."files"
          DROP CONSTRAINT "files_s3Bucket_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_customS3Bucket_fkey" FOREIGN KEY ("customS3Bucket") REFERENCES cord.s3_buckets (id) DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_customS3Bucket_fkey";

      ALTER TABLE "cord"."files"
          ADD CONSTRAINT "files_s3Bucket_fkey" FOREIGN KEY ("s3Bucket") REFERENCES cord.s3_buckets (id) DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."files" validate CONSTRAINT "files_s3Bucket_fkey";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_customS3Bucket_fkey";

      ALTER TABLE "cord"."files"
          DROP CONSTRAINT "files_s3Bucket_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_customS3Bucket_fkey" FOREIGN KEY ("customS3Bucket") REFERENCES cord.s3_buckets (id) NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_customS3Bucket_fkey";

      ALTER TABLE "cord"."files"
          ADD CONSTRAINT "files_s3Bucket_fkey" FOREIGN KEY ("s3Bucket") REFERENCES cord.s3_buckets (id) NOT valid;

      ALTER TABLE "cord"."files" validate CONSTRAINT "files_s3Bucket_fkey";

      COMMIT;`),
};
