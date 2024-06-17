'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE "cord"."org_org_members" (
          "childOrgID" uuid NOT NULL,
          "parentOrgID" uuid NOT NULL,
          "platformApplicationID" uuid NOT NULL,
          "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX org_org_members_pkey ON cord.org_org_members USING btree ("platformApplicationID", "parentOrgID", "childOrgID");

      CREATE INDEX "org_org_members_platformApplicationID_childOrgID_parentOrgI_idx" ON cord.org_org_members USING btree ("platformApplicationID", "childOrgID", "parentOrgID");

      ALTER TABLE "cord"."org_org_members"
          ADD CONSTRAINT "org_org_members_pkey" PRIMARY KEY USING INDEX "org_org_members_pkey";

      ALTER TABLE "cord"."org_org_members"
          ADD CONSTRAINT "org_org_members_childOrgID_fkey" FOREIGN KEY ("childOrgID") REFERENCES cord.orgs (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."org_org_members" validate CONSTRAINT "org_org_members_childOrgID_fkey";

      ALTER TABLE "cord"."org_org_members"
          ADD CONSTRAINT "org_org_members_parentOrgID_fkey" FOREIGN KEY ("parentOrgID") REFERENCES cord.orgs (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."org_org_members" validate CONSTRAINT "org_org_members_parentOrgID_fkey";

      ALTER TABLE "cord"."org_org_members"
          ADD CONSTRAINT "org_org_members_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."org_org_members" validate CONSTRAINT "org_org_members_platformApplicationID_fkey";

      SET check_function_bodies = OFF;

      CREATE OR REPLACE FUNCTION cord.populate_app_id ()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          AS $function$
      BEGIN
          SELECT
              INTO NEW."platformApplicationID" o."platformApplicationID"
          FROM
              orgs o
          WHERE
              o.id = NEW."orgID";
          RETURN NEW;
      END;
      $function$;

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."org_org_members"
          DROP CONSTRAINT "org_org_members_childOrgID_fkey";

      ALTER TABLE "cord"."org_org_members"
          DROP CONSTRAINT "org_org_members_parentOrgID_fkey";

      ALTER TABLE "cord"."org_org_members"
          DROP CONSTRAINT "org_org_members_platformApplicationID_fkey";

      ALTER TABLE "cord"."org_org_members"
          DROP CONSTRAINT "org_org_members_pkey";

      DROP INDEX IF EXISTS "cord"."org_org_members_pkey";

      DROP INDEX IF EXISTS "cord"."org_org_members_platformApplicationID_childOrgID_parentOrgI_idx";

      DROP TABLE "cord"."org_org_members";

      SET check_function_bodies = OFF;

      CREATE OR REPLACE FUNCTION cord.populate_app_id ()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          AS $function$
      BEGIN
          SELECT
              INTO NEW."platformApplicationID" o."platformApplicationID"
          FROM
              orgs o
          WHERE
              o.id = NEW."orgID";
          RETURN NEW;
      END;
      $function$;

      COMMIT;`),
};
