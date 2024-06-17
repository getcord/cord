'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE INDEX "email_notifications_orgID_idx" ON cord.email_notifications USING btree ("orgID");

      CREATE INDEX "email_notifications_threadOrgID_idx" ON cord.email_notifications USING btree ("threadOrgID");

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS "cord"."email_notifications_orgID_idx";

      DROP INDEX IF EXISTS "cord"."email_notifications_threadOrgID_idx";

      COMMIT;`),
};
