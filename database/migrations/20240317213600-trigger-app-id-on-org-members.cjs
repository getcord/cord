'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

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

      CREATE TRIGGER add_org_member_app_id_trigger
          BEFORE INSERT ON cord.org_members
          FOR EACH ROW
          EXECUTE FUNCTION cord.populate_app_id ();

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP TRIGGER IF EXISTS "add_org_member_app_id_trigger" ON "cord"."org_members";

      DROP FUNCTION IF EXISTS "cord"."populate_app_id" ();

      COMMIT;`),
};
