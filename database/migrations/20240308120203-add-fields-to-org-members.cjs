'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."org_members"
          ADD COLUMN "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE "cord"."org_members"
          ADD COLUMN "platformApplicationID" uuid;

      ALTER TABLE "cord"."org_members"
          ADD CONSTRAINT "org_members_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."org_members" validate CONSTRAINT "org_members_platformApplicationID_fkey";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."org_members"
          DROP CONSTRAINT "org_members_platformApplicationID_fkey";

      ALTER TABLE "cord"."org_members"
          DROP COLUMN "createdTimestamp";

      ALTER TABLE "cord"."org_members"
          DROP COLUMN "platformApplicationID";

      COMMIT;`),
};
