'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      DROP TRIGGER IF EXISTS "dirty_on_delete_trigger" ON "cord"."provider_document_mutators";

      DROP TRIGGER IF EXISTS "dirty_on_insert_trigger" ON "cord"."provider_document_mutators";

      DROP TRIGGER IF EXISTS "dirty_on_update_trigger" ON "cord"."provider_document_mutators";

      DROP TRIGGER IF EXISTS "dirty_on_delete_trigger" ON "cord"."provider_rules";

      DROP TRIGGER IF EXISTS "dirty_on_insert_trigger" ON "cord"."provider_rules";

      DROP TRIGGER IF EXISTS "dirty_on_update_trigger" ON "cord"."provider_rules";

      DROP TRIGGER IF EXISTS "dirty_on_insert_trigger" ON "cord"."providers";

      DROP TRIGGER IF EXISTS "dirty_on_update_trigger" ON "cord"."providers";

      ALTER TABLE "cord"."applications"
          DROP CONSTRAINT "applications_defaultProvider_fkey";

      ALTER TABLE "cord"."pages"
          DROP CONSTRAINT "pages_orgID_providerID_contextHash_key";

      ALTER TABLE "cord"."pages"
          DROP CONSTRAINT "pages_providerID_fkey";

      ALTER TABLE "cord"."provider_document_mutators"
          DROP CONSTRAINT "provider_document_mutators_providerID_fkey";

      ALTER TABLE "cord"."provider_rule_tests"
          DROP CONSTRAINT "provider_rule_tests_providerID_fkey";

      ALTER TABLE "cord"."provider_rules"
          DROP CONSTRAINT "provider_rules_providerID_fkey";

      ALTER TABLE "cord"."provider_rules"
          DROP CONSTRAINT "provider_rules_providerID_order_key";

      ALTER TABLE "cord"."providers"
          DROP CONSTRAINT "providers_claimingApplication_fkey";

      ALTER TABLE "cord"."published_providers"
          DROP CONSTRAINT "published_providers_providerID_fkey";

      DROP VIEW IF EXISTS "cord"."providers_view";

      DROP FUNCTION IF EXISTS "cord"."trigger_provider_dirty_update" ();

      DROP FUNCTION IF EXISTS "cord"."trigger_provider_mark_dirty" ();

      ALTER TABLE "cord"."provider_document_mutators"
          DROP CONSTRAINT "provider_document_mutators_pkey";

      ALTER TABLE "cord"."provider_rule_tests"
          DROP CONSTRAINT "provider_rule_tests_pkey";

      ALTER TABLE "cord"."provider_rules"
          DROP CONSTRAINT "provider_rules_pkey";

      ALTER TABLE "cord"."providers"
          DROP CONSTRAINT "providers_pkey";

      ALTER TABLE "cord"."published_providers"
          DROP CONSTRAINT "published_providers_pkey";

      DROP INDEX IF EXISTS "cord"."pages_orgID_providerID_contextHash_key";

      DROP INDEX IF EXISTS "cord"."provider_document_mutators_pkey";

      DROP INDEX IF EXISTS "cord"."provider_rule_tests_pkey";

      DROP INDEX IF EXISTS "cord"."provider_rules_pkey";

      DROP INDEX IF EXISTS "cord"."provider_rules_providerID_order_key";

      DROP INDEX IF EXISTS "cord"."providers_pkey";

      DROP INDEX IF EXISTS "cord"."published_providers_pkey";

      DROP TABLE "cord"."provider_document_mutators";

      DROP TABLE "cord"."provider_rule_tests";

      DROP TABLE "cord"."provider_rules";

      DROP TABLE "cord"."providers";

      DROP TABLE "cord"."published_providers";

      ALTER TABLE "cord"."applications"
          DROP COLUMN "defaultProvider";

      ALTER TABLE "cord"."pages"
          DROP COLUMN "providerID";

      DROP TYPE "cord"."provider_document_mutator_type";

      DROP TYPE "cord"."provider_rule_match_status";

      DROP TYPE "cord"."provider_rule_type";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE "cord"."provider_document_mutator_type" AS enum (
          'custom_css',
          'fixed_elements',
          'default_css'
      );

      CREATE TYPE "cord"."provider_rule_match_status" AS enum (
          'deny',
          'allow',
          'none'
      );

      CREATE TYPE "cord"."provider_rule_type" AS enum (
          'deny',
          'allow'
      );

      CREATE TABLE "cord"."provider_document_mutators" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "providerID" uuid NOT NULL,
          "type" cord.provider_document_mutator_type NOT NULL,
          "config" jsonb
      );

      CREATE TABLE "cord"."provider_rule_tests" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "providerID" uuid NOT NULL,
          "url" text NOT NULL,
          "documentHTML" text,
          "expectedMatch" cord.provider_rule_match_status NOT NULL,
          "expectedContextData" jsonb,
          "expectedName" text
      );

      CREATE TABLE "cord"."provider_rules" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "providerID" uuid NOT NULL,
          "type" cord.provider_rule_type NOT NULL,
          "order" smallint NOT NULL,
          "matchPatterns" jsonb NOT NULL,
          "observeDOMMutations" boolean NOT NULL DEFAULT FALSE,
          "nameTemplate" text,
          "contextTransformation" jsonb NOT NULL DEFAULT '{"type": "default"}' ::jsonb
      );

      CREATE TABLE "cord"."providers" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "name" text NOT NULL,
          "domains" text[] NOT NULL DEFAULT '{}' ::text[],
          "iconURL" text NOT NULL,
          "nuxText" text,
          "mergeHashWithLocation" boolean NOT NULL DEFAULT FALSE,
          "disableAnnotations" boolean NOT NULL DEFAULT FALSE,
          "visibleInDiscoverToolsSection" boolean NOT NULL DEFAULT TRUE,
          "dirty" boolean NOT NULL DEFAULT TRUE,
          "claimingApplication" uuid
      );

      CREATE TABLE "cord"."published_providers" (
          "providerID" uuid NOT NULL,
          "lastPublishedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          "ruleProvider" jsonb NOT NULL
      );

      ALTER TABLE "cord"."applications"
          ADD COLUMN "defaultProvider" uuid;

      ALTER TABLE "cord"."pages"
          ADD COLUMN "providerID" uuid;

      CREATE UNIQUE INDEX "pages_orgID_providerID_contextHash_key" ON cord.pages USING btree ("orgID", "providerID", "contextHash");

      CREATE UNIQUE INDEX provider_document_mutators_pkey ON cord.provider_document_mutators USING btree (id);

      CREATE UNIQUE INDEX provider_rule_tests_pkey ON cord.provider_rule_tests USING btree (id);

      CREATE UNIQUE INDEX provider_rules_pkey ON cord.provider_rules USING btree (id);

      CREATE UNIQUE INDEX "provider_rules_providerID_order_key" ON cord.provider_rules USING btree ("providerID", "order");

      CREATE UNIQUE INDEX providers_pkey ON cord.providers USING btree (id);

      CREATE UNIQUE INDEX published_providers_pkey ON cord.published_providers USING btree ("providerID");

      ALTER TABLE "cord"."provider_document_mutators"
          ADD CONSTRAINT "provider_document_mutators_pkey" PRIMARY KEY USING INDEX "provider_document_mutators_pkey";

      ALTER TABLE "cord"."provider_rule_tests"
          ADD CONSTRAINT "provider_rule_tests_pkey" PRIMARY KEY USING INDEX "provider_rule_tests_pkey";

      ALTER TABLE "cord"."provider_rules"
          ADD CONSTRAINT "provider_rules_pkey" PRIMARY KEY USING INDEX "provider_rules_pkey";

      ALTER TABLE "cord"."providers"
          ADD CONSTRAINT "providers_pkey" PRIMARY KEY USING INDEX "providers_pkey";

      ALTER TABLE "cord"."published_providers"
          ADD CONSTRAINT "published_providers_pkey" PRIMARY KEY USING INDEX "published_providers_pkey";

      ALTER TABLE "cord"."applications"
          ADD CONSTRAINT "applications_defaultProvider_fkey" FOREIGN KEY ("defaultProvider") REFERENCES cord.providers (id) ON DELETE SET NULL NOT valid;

      ALTER TABLE "cord"."applications" validate CONSTRAINT "applications_defaultProvider_fkey";

      ALTER TABLE "cord"."pages"
          ADD CONSTRAINT "pages_orgID_providerID_contextHash_key" UNIQUE USING INDEX "pages_orgID_providerID_contextHash_key";

      ALTER TABLE "cord"."pages"
          ADD CONSTRAINT "pages_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers (id) NOT valid;

      ALTER TABLE "cord"."pages" validate CONSTRAINT "pages_providerID_fkey";

      ALTER TABLE "cord"."provider_document_mutators"
          ADD CONSTRAINT "provider_document_mutators_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."provider_document_mutators" validate CONSTRAINT "provider_document_mutators_providerID_fkey";

      ALTER TABLE "cord"."provider_rule_tests"
          ADD CONSTRAINT "provider_rule_tests_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."provider_rule_tests" validate CONSTRAINT "provider_rule_tests_providerID_fkey";

      ALTER TABLE "cord"."provider_rules"
          ADD CONSTRAINT "provider_rules_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers (id) ON DELETE CASCADE NOT valid;

      ALTER TABLE "cord"."provider_rules" validate CONSTRAINT "provider_rules_providerID_fkey";

      ALTER TABLE "cord"."provider_rules"
          ADD CONSTRAINT "provider_rules_providerID_order_key" UNIQUE USING INDEX "provider_rules_providerID_order_key" DEFERRABLE INITIALLY DEFERRED;

      ALTER TABLE "cord"."providers"
          ADD CONSTRAINT "providers_claimingApplication_fkey" FOREIGN KEY ("claimingApplication") REFERENCES cord.applications (id) ON DELETE SET NULL NOT valid;

      ALTER TABLE "cord"."providers" validate CONSTRAINT "providers_claimingApplication_fkey";

      ALTER TABLE "cord"."published_providers"
          ADD CONSTRAINT "published_providers_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers (id) NOT valid;

      ALTER TABLE "cord"."published_providers" validate CONSTRAINT "published_providers_providerID_fkey";

      SET check_function_bodies = OFF;

      CREATE OR REPLACE VIEW "cord"."providers_view" AS
      WITH dm AS (
          SELECT
              provider_document_mutators."providerID",
              jsonb_agg(((row_to_json(provider_document_mutators.*))::jsonb - 'providerID'::text)) AS "documentMutators"
          FROM
              cord.provider_document_mutators
          GROUP BY
              provider_document_mutators."providerID"
      ),
      rules AS (
          SELECT
              provider_rules."providerID",
              jsonb_agg(((row_to_json(provider_rules.*))::jsonb - ARRAY['providerID'::text, 'order'::text])
      ORDER BY provider_rules."order") AS rules
          FROM
              cord.provider_rules
          GROUP BY
              provider_rules."providerID"
      )
      SELECT
          p.id,
          p.name,
          p.domains,
          p."claimingApplication",
          p."iconURL",
          p."nuxText",
          p."mergeHashWithLocation",
          p."disableAnnotations",
          p."visibleInDiscoverToolsSection",
          p.dirty,
          COALESCE(dm."documentMutators", '[]'::jsonb) AS "documentMutators",
          COALESCE(rules.rules, '[]'::jsonb) AS rules
      FROM ((cord.providers p
          LEFT JOIN dm ON (p.id = dm."providerID"))
          LEFT JOIN rules ON (p.id = rules."providerID"));

      CREATE OR REPLACE FUNCTION cord.trigger_provider_dirty_update ()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          AS $function$
      BEGIN
          NEW.dirty := TRUE;
          RETURN NEW;
      END;
      $function$;

      CREATE OR REPLACE FUNCTION cord.trigger_provider_mark_dirty ()
          RETURNS TRIGGER
          LANGUAGE plpgsql
          AS $function$
      BEGIN
          UPDATE
              cord.providers
          SET
              dirty = 't'
          WHERE
              id IN (OLD."providerID", NEW."providerID");
          RETURN NEW;
      END;
      $function$;

      CREATE TRIGGER dirty_on_delete_trigger
          AFTER DELETE ON cord.provider_document_mutators
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_insert_trigger
          AFTER INSERT ON cord.provider_document_mutators
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_update_trigger
          AFTER UPDATE ON cord.provider_document_mutators
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_delete_trigger
          AFTER DELETE ON cord.provider_rules
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_insert_trigger
          AFTER INSERT ON cord.provider_rules
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_update_trigger
          AFTER UPDATE ON cord.provider_rules
          FOR EACH ROW
          EXECUTE FUNCTION cord.trigger_provider_mark_dirty ();

      CREATE TRIGGER dirty_on_insert_trigger
          BEFORE INSERT ON cord.providers
          FOR EACH ROW
          WHEN ((NOT new.dirty))
          EXECUTE FUNCTION cord.trigger_provider_dirty_update ();

      CREATE TRIGGER dirty_on_update_trigger
          BEFORE UPDATE OF id,
          name,
          domains,
          "iconURL",
          "nuxText",
          "mergeHashWithLocation",
          "disableAnnotations",
          "visibleInDiscoverToolsSection" ON cord.providers
          FOR EACH ROW
          WHEN ((NOT old.dirty))
          EXECUTE FUNCTION cord.trigger_provider_dirty_update ();

      COMMIT;`),
};
