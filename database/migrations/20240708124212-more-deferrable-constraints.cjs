'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_supportBotID_fkey";

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_supportOrgID_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_supportBotID_fkey" FOREIGN KEY ("supportBotID") REFERENCES cord.users (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_supportBotID_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_supportOrgID_fkey" FOREIGN KEY ("supportOrgID") REFERENCES cord.orgs (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_supportOrgID_fkey";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_supportBotID_fkey";

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_supportOrgID_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_supportBotID_fkey" FOREIGN KEY ("supportBotID") REFERENCES cord.users (id) ON DELETE SET NULL NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_supportBotID_fkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_supportOrgID_fkey" FOREIGN KEY ("supportOrgID") REFERENCES cord.orgs (id) ON DELETE SET NULL NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_supportOrgID_fkey";

      COMMIT;`),
};
