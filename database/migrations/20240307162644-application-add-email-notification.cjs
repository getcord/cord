'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          ADD COLUMN "enableEmailNotifications" boolean NOT NULL DEFAULT TRUE;

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."applications"
          DROP COLUMN "enableEmailNotifications";

      COMMIT;`),
};
