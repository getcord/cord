'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."customers"
          ADD COLUMN "renewalDate" timestamp with time zone;

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."customers"
          DROP COLUMN "renewalDate";

      COMMIT;`),
};
