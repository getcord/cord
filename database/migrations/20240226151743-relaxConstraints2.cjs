'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."page_visitors"
          DROP CONSTRAINT "page_visitors_pageContextHash_orgID_fkey";

      ALTER TABLE "cord"."user_hidden_annotations"
          DROP CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey";

      ALTER TABLE "cord"."page_visitors"
          ADD CONSTRAINT "page_visitors_pageContextHash_orgID_fkey" FOREIGN KEY ("pageContextHash", "orgID") REFERENCES cord.pages ("contextHash", "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."page_visitors" validate CONSTRAINT "page_visitors_pageContextHash_orgID_fkey";

      ALTER TABLE "cord"."user_hidden_annotations"
          ADD CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages ("orgID", "contextHash") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT valid;

      ALTER TABLE "cord"."user_hidden_annotations" validate CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."page_visitors"
          DROP CONSTRAINT "page_visitors_pageContextHash_orgID_fkey";

      ALTER TABLE "cord"."user_hidden_annotations"
          DROP CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey";

      ALTER TABLE "cord"."page_visitors"
          ADD CONSTRAINT "page_visitors_pageContextHash_orgID_fkey" FOREIGN KEY ("pageContextHash", "orgID") REFERENCES cord.pages ("contextHash", "orgID") ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."page_visitors" validate CONSTRAINT "page_visitors_pageContextHash_orgID_fkey";

      ALTER TABLE "cord"."user_hidden_annotations"
          ADD CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages ("orgID", "contextHash") ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."user_hidden_annotations" validate CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey";

      COMMIT;`),
};
