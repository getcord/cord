'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE "cord"."thread_action_type" AS enum (
          'resolve',
          'unresolve'
      );

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check1";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check4";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check5";

      ALTER TYPE "cord"."notification_type" RENAME TO "notification_type__old_version_to_be_dropped";

      CREATE TYPE "cord"."notification_type" AS enum (
          'reply',
          'reaction',
          'external',
          'thread_action'
      );

      ALTER TABLE "cord"."notifications"
          ALTER COLUMN type TYPE "cord"."notification_type"
          USING TYPE::text::"cord"."notification_type";

      DROP TYPE "cord"."notification_type__old_version_to_be_dropped";

      ALTER TABLE "cord"."notifications"
          ADD COLUMN "threadActionType" cord.thread_action_type;

      ALTER TABLE "cord"."notifications"
          ADD COLUMN "threadID" uuid;

      CREATE INDEX "notifications_threadID_idx" ON cord.notifications USING btree ("threadID")
      WHERE ("threadID" IS NOT NULL);

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check6" CHECK ((("externalTemplate" IS NOT NULL) = ((type)::text = 'external'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check6";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check7" CHECK ((("externalURL" IS NOT NULL) = ((type)::text = 'external'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check7";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_threadID_fkey" FOREIGN KEY ("threadID") REFERENCES cord.threads (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_threadID_fkey";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check1" CHECK ((("messageID" IS NULL) = ((type)::text = 'external'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check1";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check4" CHECK ((("threadID" IS NOT NULL) OR ((type)::text <> 'thread_action'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check4";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check5" CHECK ((("threadActionType" IS NOT NULL) = ((type)::text = 'thread_action'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check5";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check6";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check7";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_threadID_fkey";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check1";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check4";

      ALTER TABLE "cord"."notifications"
          DROP CONSTRAINT "notifications_check5";

      DROP INDEX IF EXISTS "cord"."notifications_threadID_idx";

      ALTER TYPE "cord"."notification_type" RENAME TO "notification_type__old_version_to_be_dropped";

      CREATE TYPE "cord"."notification_type" AS enum (
          'reply',
          'reaction',
          'external'
      );

      ALTER TABLE "cord"."notifications"
          ALTER COLUMN type TYPE "cord"."notification_type"
          USING TYPE::text::"cord"."notification_type";

      DROP TYPE "cord"."notification_type__old_version_to_be_dropped";

      ALTER TABLE "cord"."notifications"
          DROP COLUMN "threadActionType";

      ALTER TABLE "cord"."notifications"
          DROP COLUMN "threadID";

      DROP TYPE "cord"."thread_action_type";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check1" CHECK ((("messageID" IS NOT NULL) = (((type)::text = 'reply'::text) OR ((type)::text = 'reaction'::text)))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check1";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check4" CHECK ((("externalTemplate" IS NOT NULL) = ((type)::text = 'external'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check4";

      ALTER TABLE "cord"."notifications"
          ADD CONSTRAINT "notifications_check5" CHECK ((("externalURL" IS NOT NULL) = ((type)::text = 'external'::text))) NOT valid;

      ALTER TABLE "cord"."notifications" validate CONSTRAINT "notifications_check5";

      COMMIT;`),
};
