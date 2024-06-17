'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."customers"
          ADD COLUMN "planDescription" text[] NOT NULL DEFAULT '{}'::text[];

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."customers"
          DROP COLUMN "planDescription";

      COMMIT;`),
};
