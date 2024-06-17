'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."threads"
          DROP CONSTRAINT "threads_orgID_pageContextHash_fkey";

      ALTER TABLE "cord"."threads"
          ADD CONSTRAINT "threads_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages ("orgID", "contextHash") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."threads" validate CONSTRAINT "threads_orgID_pageContextHash_fkey";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."threads"
          DROP CONSTRAINT "threads_orgID_pageContextHash_fkey";

      ALTER TABLE "cord"."threads"
          ADD CONSTRAINT "threads_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages ("orgID", "contextHash") ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."threads" validate CONSTRAINT "threads_orgID_pageContextHash_fkey";

      COMMIT;`),
};
