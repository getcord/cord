'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE INDEX "org_members_platformApplicationID_orgID_idx" ON cord.org_members USING btree ("platformApplicationID", "orgID");

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

      DROP INDEX IF EXISTS "cord"."org_members_platformApplicationID_orgID_idx";

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
