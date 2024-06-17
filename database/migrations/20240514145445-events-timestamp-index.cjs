'use strict';

module.exports = {
  up: (queryInterface) =>
    // This is not inside a transaction because CREATE INDEX CONCURRENTLY can't
    // be done inside transactions.  We need to use CONCURRENTLY because without
    // it, CREATE INDEX locks the table for the time it takes to create the
    // index, and that will take a very long time in production for this one.
    queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY "events_serverTimestamp_idx" ON cord.events USING btree ("serverTimestamp");
`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."events_serverTimestamp_idx";

      COMMIT;`),
};
