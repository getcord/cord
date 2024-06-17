'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE "cord"."permission" RENAME TO "permission__old_version_to_be_dropped";

      CREATE TYPE "cord"."permission" AS enum (
          'thread:read',
          'thread:send-message',
          'thread-participant:read',
          'message:read'
      );

         ALTER TABLE "cord"."permission_rules"
             ALTER COLUMN permissions TYPE "cord"."permission"[]
             USING permissions::text::"cord"."permission"[];

      DROP TYPE "cord"."permission__old_version_to_be_dropped";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE "cord"."permission" RENAME TO "permission__old_version_to_be_dropped";

      CREATE TYPE "cord"."permission" AS enum (
          'thread:read',
          'thread:send-message',
          'message:read'
      );

         ALTER TABLE "cord"."permission_rules"
             ALTER COLUMN permissions TYPE "cord"."permission"[]
             USING permissions::text::"cord"."permission"[];

      DROP TYPE "cord"."permission__old_version_to_be_dropped";

      COMMIT;`),
};
