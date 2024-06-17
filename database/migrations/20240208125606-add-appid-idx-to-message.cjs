'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE INDEX "messages_platformApplicationID_idx" ON cord.messages USING btree ("platformApplicationID");

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."messages_platformApplicationID_idx";

      COMMIT;`),
};
