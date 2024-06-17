'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE INDEX "threads_orgID_pageContextHash_idx" ON cord.threads USING btree ("orgID", "pageContextHash");

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."threads_orgID_pageContextHash_idx";

      COMMIT;`),
};
