'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."invites"
          DROP CONSTRAINT "invites_creatorUserID_fkey";

      ALTER TABLE "cord"."invites"
          DROP CONSTRAINT "invites_pkey";

      DROP INDEX IF EXISTS "cord"."invites_orgID_creatorUserID_idx";

      DROP INDEX IF EXISTS "cord"."invites_orgID_invitedUserID_idx";

      DROP INDEX IF EXISTS "cord"."invites_pkey";

      DROP TABLE "cord"."invites";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE "cord"."invites" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "orgID" uuid NOT NULL,
          "creatorUserID" uuid NOT NULL,
          "invitedUserID" uuid,
          "validUntilTimestamp" timestamp with time zone NOT NULL,
          "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "invites_orgID_creatorUserID_idx" ON cord.invites USING btree ("orgID", "creatorUserID");

      CREATE INDEX "invites_orgID_invitedUserID_idx" ON cord.invites USING btree ("orgID", "invitedUserID");

      CREATE UNIQUE INDEX invites_pkey ON cord.invites USING btree (id);

      ALTER TABLE "cord"."invites"
          ADD CONSTRAINT "invites_pkey" PRIMARY KEY USING INDEX "invites_pkey";

      ALTER TABLE "cord"."invites"
          ADD CONSTRAINT "invites_creatorUserID_fkey" FOREIGN KEY ("creatorUserID") REFERENCES cord.users (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."invites" validate CONSTRAINT "invites_creatorUserID_fkey";

      COMMIT;`),
};
