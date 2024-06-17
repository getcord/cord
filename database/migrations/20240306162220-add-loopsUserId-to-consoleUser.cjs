'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."console_users"
          ADD COLUMN "loopsUserID" uuid;

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."console_users"
          DROP COLUMN "loopsUserID";

      COMMIT;`),
};
