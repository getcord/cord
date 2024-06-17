'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."optimize_new_errors";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE INDEX optimize_new_errors ON cord.events USING btree ("serverTimestamp")
      WHERE (type = ANY (ARRAY['react-error'::text, 'graphql-error'::text]));

      COMMIT;`),
};
