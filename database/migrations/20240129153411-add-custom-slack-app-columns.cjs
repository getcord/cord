'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."orgs_externalProvider_externalID_idx";

      ALTER TABLE "cord"."applications"
          ADD COLUMN "customSlackAppDetails" jsonb;

      ALTER TABLE "cord"."applications"
          ADD COLUMN "customSlackAppID" text;

      ALTER TABLE "cord"."orgs"
          ADD COLUMN "customSlackAppID" text;

      CREATE UNIQUE INDEX "orgs_externalProvider_externalID_customSlackAppID_idx" ON cord.orgs USING btree ("externalProvider", "externalID", "customSlackAppID")
      WHERE ("platformApplicationID" IS NULL);

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_check" CHECK ((("customSlackAppID" IS NOT NULL) = ("customSlackAppDetails" IS NOT NULL))) NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_check";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_check";

      DROP INDEX IF EXISTS "cord"."orgs_externalProvider_externalID_customSlackAppID_idx";

      ALTER TABLE "cord"."applications"
          DROP COLUMN "customSlackAppDetails";

      ALTER TABLE "cord"."applications"
          DROP COLUMN "customSlackAppID";

      ALTER TABLE "cord"."orgs"
          DROP COLUMN "customSlackAppID";

      CREATE UNIQUE INDEX "orgs_externalProvider_externalID_idx" ON cord.orgs USING btree ("externalProvider", "externalID")
      WHERE ("platformApplicationID" IS NULL);

      COMMIT;`),
};
