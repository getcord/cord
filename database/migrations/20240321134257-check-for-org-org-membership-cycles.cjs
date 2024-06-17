'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      SET check_function_bodies = OFF;

      CREATE OR REPLACE FUNCTION cord.check_cycle ()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          AS $function$
      BEGIN
          IF EXISTS (
              -- Recursive query to check for cycles
              WITH RECURSIVE relationship_path AS (
                  SELECT
                      "parentOrgID",
                      "childOrgID"
                  FROM
                      org_org_members
                  WHERE
                      "parentOrgID" = NEW."childOrgID"
                  UNION ALL
                  SELECT
                      oom."parentOrgID",
                      oom."childOrgID"
                  FROM
                      org_org_members oom
                      JOIN relationship_path rp ON oom."parentOrgID" = rp."childOrgID"
      )
                  SELECT
                      1
                  FROM
                      relationship_path
                  WHERE
                      "parentOrgID" = NEW."childOrgID") THEN
                  RAISE EXCEPTION 'Insertion would create a cycle';
      END IF;
          RETURN NEW;
      END;
      $function$;

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

      CREATE TRIGGER enforce_no_cycle
          BEFORE INSERT OR UPDATE ON cord.org_org_members
          FOR EACH ROW
          EXECUTE FUNCTION cord.check_cycle ();

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP TRIGGER IF EXISTS "enforce_no_cycle" ON "cord"."org_org_members";

      DROP FUNCTION IF EXISTS "cord"."check_cycle" ();

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
