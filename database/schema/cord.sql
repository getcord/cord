--                  ________            ______               __
--                 /_  __/ /_  ___     / ____/___  _________/ /
--                  / / / __ \/ _ \   / /   / __ \/ ___/ __  /
--                 / / / / / /  __/  / /___/ /_/ / /  / /_/ /
--                /_/ /_/ /_/\___/   \____/\____/_/   \__,_/
--
--                    ____        __        __
--                   / __ \____ _/ /_____ _/ /_  ____ _________
--                  / / / / __ `/ __/ __ `/ __ \/ __ `/ ___/ _ \
--                 / /_/ / /_/ / /_/ /_/ / /_/ / /_/ (__  )  __/
--                /_____/\__,_/\__/\__,_/_.___/\__,_/____/\___/
--
--                      _____      __
--                     / ___/_____/ /_  ___  ____ ___  ____ _
--                     \__ \/ ___/ __ \/ _ \/ __ `__ \/ __ `/
--                    ___/ / /__/ / / /  __/ / / / / / /_/ /
--                   /____/\___/_/ /_/\___/_/ /_/ /_/\__,_/

--
--
--
--
--
--
--
--                                             *&&&&&&&&&&&&&&&&&&
--                   .*,                       *&&&&&&&&&&&&&&&&&&
--                &&&&&&&&&&&&.                *&&&&&&&&&%
--               &&&&&&&&&&&&&&&&&             *&&&&&&&&&&&%
--               &&&&&&     /&&&&&&&&          *&&&&&  &&&&&&
--                &&&&&&        &&&&&&&&       *&&&&&    &&&&&&
--                 &&&&&&          &&&&&&&     *&&&&&     &&&&&&
--                  .&&&&&&          &&&&&&%               &&&&&&
--                    %&&&&&&          &&&&&&               &&&&&
--                      (&&&&&&&        (&&&&&              &&&&&.
--                         &&&&&&&&      .&&&&&             &&&&&
--                           .&&&&&&&&&   &&&&&&          &&&&&&.
--                   *           &&&&&&&&&&&&&&&       &&&&&&&&
--                (&&&&&,            &&&&&&&&&&&&&&&&&&&&&&&&
--                 &&&&&&&&&,            &&&&&&&&&&&&&&&&
--                    %&&&&&&&&&&&&&&&&&&&&&&&
--                        ,&&&&&&&&&&&&&&&&,
--
--
--
--
--
--
--


-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- HELPER FUNCTIONS
-- --

-- This function turns our JSON message content into a flat string, containing
-- all the text.
CREATE OR REPLACE FUNCTION cord.message_content_text(IN content jsonb)
    RETURNS text IMMUTABLE AS $$
      DECLARE
        element jsonb;
        result text := NULL;
      BEGIN
          CASE jsonb_typeof(content)
          WHEN 'array' THEN
            FOR element IN SELECT jsonb_array_elements(content)
            LOOP
              result := concat_ws(' ', result, trim(' ' FROM cord.message_content_text(element)));
            END LOOP;
            RETURN result;
          WHEN 'object' THEN
            RETURN concat_ws(
                ' ',
                trim(' ' FROM content->>'text'),
                trim(' ' FROM cord.message_content_text(content->'children'))
            );
          ELSE
            RETURN NULL;
          END CASE;
      END;
      $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- CUSTOMERS & APPLICATIONS
-- --

CREATE TABLE s3_buckets (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "region" text NOT NULL,
    "name" text NOT NULL,
    "accessKeyID" text NOT NULL,
    "accessKeySecret" text NOT NULL
);

CREATE TYPE customer_type AS enum (
    'verified',
    'sample'
);

CREATE TYPE customer_implementation_stage AS enum (
    'launched',
    'implementing',
    'proof_of_concept',
    'inactive'
);

CREATE TYPE pricing_tier AS enum (
    'free',
    'pro',
    'scale'
);

CREATE TYPE billing_type AS enum (
    'stripe',
    'manual'
);

CREATE TABLE customers (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "sharedSecret" text NOT NULL DEFAULT encode(sha256(uuid_generate_v4()::text::bytea), 'hex'),
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enableCustomS3Bucket" boolean NOT NULL DEFAULT FALSE,
    "enableCustomSegmentWriteKey" boolean NOT NULL DEFAULT FALSE,
    "type" customer_type NOT NULL DEFAULT 'verified',
    "implementationStage" customer_implementation_stage NOT NULL DEFAULT 'proof_of_concept',
    "launchDate" timestamp with time zone,
    "slackChannel" text,
    "signupCoupon" text,
    "stripeCustomerID" text,
    "pricingTier" pricing_tier NOT NULL DEFAULT 'free',
    "billingStatus" text NOT NULL DEFAULT 'inactive',
    "billingType" billing_type,
    -- The CHECK constraint on addons checks that all values in addons are
    -- flat objects with non-null values
    "addons" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "addons" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),
    "planDescription" text ARRAY NOT NULL DEFAULT '{}',
    "renewalDate" timestamp with time zone
);

CREATE TYPE application_tier AS enum (
    'free',
    'starter',
    'premium'
);

CREATE TYPE application_environment AS enum (
    'production',
    'staging',
    'sample', -- console self-serve apps
    'sampletoken', -- docs integration guide and demo apps github repos: just creates basic 'Sample User'
    'demo' -- demo apps on docs.cord.com and cord.com (but not the opensource github repos): these apps are prepopulated with users and comments
);

CREATE TABLE applications (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "sharedSecret" text NOT NULL DEFAULT encode(sha256(uuid_generate_v4()::text::bytea), 'hex'),
    "customColors" jsonb,
    "customEmailTemplate" jsonb,
    "customLinks" jsonb,
    "customS3Bucket" UUID REFERENCES s3_buckets (id),
    "segmentWriteKey" text,
    "customNUX" jsonb,
    "iconURL" text,
    "type" application_tier NOT NULL DEFAULT 'free',
    "environment" application_environment NOT NULL DEFAULT 'production',
    "supportOrgID" UUID,
    -- REFERENCES orgs (id) -- declared below
    "supportBotID" UUID,
    -- REFERENCES users (id) -- declared below
    "supportSlackChannelID" text,
    "redirectURI" text,
    "defaultProvider" UUID,
    -- REFERENCES providers (id) -- declared below
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerID" UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    "slackConnectAllOrgs" boolean NOT NULL DEFAULT FALSE,
    "eventWebhookURL" text,
    "eventWebhookSubscriptions" text[],
    "customSlackAppID" text,
    "customSlackAppDetails" jsonb,
    "enableEmailNotifications" boolean NOT NULL DEFAULT TRUE,
    CHECK(("customSlackAppID" IS NOT NULL) = ("customSlackAppDetails" IS NOT NULL))
);

CREATE UNIQUE INDEX ON applications("supportOrgID", "supportSlackChannelID");

CREATE TABLE application_webhooks (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "platformApplicationID" UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "eventWebhookURL" text NOT NULL,
    "eventWebhookSubscriptions" text[]
);

CREATE UNIQUE INDEX ON application_webhooks("platformApplicationID", "eventWebhookURL");

CREATE TYPE customer_access_status AS enum (
    'pending',
    'approved'
);

CREATE TABLE console_users (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "name" text,
    "email" text NOT NULL,
    "picture" text,
    "customerID" UUID REFERENCES customers (id) ON DELETE CASCADE,
    "verified" boolean NOT NULL DEFAULT FALSE,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth0UserID" text,
    "pendingCustomerID" UUID REFERENCES customers (id),
    "loopsUserID" UUID,

    -- checks to make sure customerID and pendingCustomerID cannot have values at
    -- the same time
    CHECK((("pendingCustomerID" IS NULL) != ("customerID" IS NULL)) OR ("pendingCustomerID" IS NULL AND "customerID" IS NULL))

);

CREATE UNIQUE INDEX ON console_users("email");


-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- TYPE DEFINITIONS
-- --

CREATE TYPE tier_type AS enum (
    'prod',
    'staging',
    'test',
    'dev',
    'loadtest'
);

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- USERS
-- --

CREATE TYPE user_type AS enum (
    'person',
    'bot'
);

CREATE TYPE user_state AS enum (
    'active',
    'deleted'
);

CREATE TYPE profile_external_provider_type AS ENUM (
    'slack',
    'platform'
);

CREATE TABLE users (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userType" user_type NOT NULL DEFAULT 'person',
    "admin" boolean NOT NULL DEFAULT FALSE,
    "state" user_state NOT NULL DEFAULT 'active',
    "name" text, -- provided by an API: either the platform api (from our customers' devs), or the Slack one
    "nameUpdatedTimestamp" timestamp with time zone,
    "screenName" text,
    "email" text,
    "profilePictureURL" text, -- provided by an API: either the platform api (from our customers' devs), or the Slack one
    "profilePictureURLUpdatedTimestamp" timestamp with time zone,
    "externalID" text NOT NULL,
    "externalProvider" profile_external_provider_type,
    "platformApplicationID" UUID REFERENCES applications (id) ON DELETE CASCADE,

    -- The CHECK constraint on metadata checks that all values in metadata are
    -- flat objects with non-null values (this is the same check we do for
    -- "pages"."contextData", as well as other metadata columns.)
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),

    -- checks to enforce name/picture timestamps, used to calculate platform users' 'unified profile'
    CHECK(("name" IS NOT NULL) = ("nameUpdatedTimestamp" IS NOT NULL))
);

CREATE UNIQUE INDEX ON users ("platformApplicationID", "externalID")
    WHERE "platformApplicationID" IS NOT NULL;
CREATE INDEX ON users ("externalID") WHERE "externalProvider" = 'slack';

CREATE INDEX ON users ("email");
CREATE INDEX ON users USING gin("metadata");
-- For mention list searching:
CREATE INDEX ON users ("platformApplicationID", LOWER("name"));
CREATE INDEX ON users ("platformApplicationID", LOWER("screenName"));
-- For UserLiveQuery:
CREATE INDEX ON users ("platformApplicationID", "updatedTimestamp");

CREATE OR REPLACE FUNCTION cord.user_update_timestamp() RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW."updatedTimestamp" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;

CREATE TRIGGER trigger_user_update_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION user_update_timestamp();

ALTER TABLE applications
    ADD FOREIGN KEY ("supportBotID")
    REFERENCES users ("id")
    ON DELETE SET NULL;

CREATE TABLE user_preferences (
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "key" text NOT NULL,
    "value" jsonb NOT NULL,
    PRIMARY KEY ("userID", "key")
);

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- ORGS
-- --

CREATE TYPE "org_state" AS enum (
    'inactive',
    'active'
);

CREATE TYPE org_external_provider_type AS ENUM (
    'slack',
    'platform'
);

CREATE TABLE orgs (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "externalID" text NOT NULL,
    "externalProvider" org_external_provider_type NOT NULL,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    state "org_state" NOT NULL,
    "externalAuthData" jsonb,
    "platformApplicationID" UUID REFERENCES applications (id) ON DELETE CASCADE,
    domain text,
    internal boolean NOT NULL DEFAULT false,
    -- The CHECK constraint on metadata checks that all values in metadata are
    -- flat objects with non-null values (this is the same check we do for
    -- "pages"."contextData", as well as other metadata columns.)
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),
    -- For externalProvider=platform we need a NOT-NULL platformApplicationID.
    -- For any other externalProvider, platformApplicationID must be NULL.
    CHECK(
        ("externalProvider" = 'platform') = ("platformApplicationID" IS NOT NULL)
    ),
    "customSlackAppID" text
);

ALTER TABLE applications
    ADD FOREIGN KEY ("supportOrgID")
    REFERENCES orgs ("id")
    ON DELETE SET NULL;

CREATE INDEX ON orgs USING gin("metadata");

-- The combination of externalProvider/platformApplicationID/externalID must be
-- unique. Likewise, so must externalProvider/externalID/customSlackAppID.
CREATE UNIQUE INDEX ON orgs("platformApplicationID", "externalID", "externalProvider")
    WHERE "platformApplicationID" IS NOT NULL;
CREATE UNIQUE INDEX ON orgs("externalProvider", "externalID", "customSlackAppID")
    WHERE "platformApplicationID" IS NULL;

CREATE UNIQUE INDEX ON orgs(id, "externalProvider");

CREATE TABLE org_members (
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "platformApplicationID" uuid REFERENCES applications (id) ON DELETE CASCADE,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("orgID", "userID")
);

--- Add an index by "userID" first to speed up queries for specific userIDs.
CREATE UNIQUE INDEX "org_members_orgID_userID_key" ON org_members USING btree ("userID", "orgID");
CREATE INDEX ON org_members ("platformApplicationID", "orgID");

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

CREATE TABLE org_org_members (
    "childOrgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "parentOrgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "platformApplicationID" uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("platformApplicationID", "parentOrgID", "childOrgID")
);
CREATE INDEX ON org_org_members ("platformApplicationID", "childOrgID", "parentOrgID");

-- Create a trigger function to check for cycles in org org membership
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

-- Create a trigger to enforce cycle checking before insertion
CREATE TRIGGER enforce_no_cycle
BEFORE INSERT OR UPDATE ON org_org_members
FOR EACH ROW EXECUTE FUNCTION check_cycle();

CREATE TABLE linked_orgs (
    "sourceOrgID" uuid NOT NULL UNIQUE REFERENCES orgs (id) ON DELETE CASCADE,
    "sourceExternalProvider" org_external_provider_type NOT NULL CHECK ("sourceExternalProvider" = 'platform'),
    "linkedOrgID" uuid NOT NULL REFERENCES orgs (id),
    "linkedExternalProvider" org_external_provider_type NOT NULL CHECK ("linkedExternalProvider" != 'platform'),
    "mergerUserID" uuid REFERENCES users (id) ON DELETE SET NULL,
    "linkedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CHECK ("sourceOrgID" <> "linkedOrgID"),
    PRIMARY KEY("sourceOrgID", "linkedOrgID"),
    FOREIGN KEY ("sourceOrgID", "sourceExternalProvider") REFERENCES orgs(id, "externalProvider") ON DELETE CASCADE,
    FOREIGN KEY ("linkedOrgID", "linkedExternalProvider") REFERENCES orgs(id, "externalProvider")
);

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- EXTERNAL PLATFORM USERS
-- --

CREATE TABLE linked_users (
    "sourceUserID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "sourceOrgID" uuid NOT NULL,
    "linkedUserID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "linkedOrgID" uuid NOT NULL,
    "linkedTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ("sourceUserID" <> "linkedUserID"),
    PRIMARY KEY ("sourceUserID", "sourceOrgID", "linkedUserID", "linkedOrgID"),
    FOREIGN KEY ("sourceOrgID", "linkedOrgID") REFERENCES linked_orgs ("sourceOrgID", "linkedOrgID") ON DELETE CASCADE
);

CREATE INDEX ON linked_users ("linkedUserID", "sourceUserID");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- PROVIDERS AND RELATED TABLES
-- --

CREATE TABLE providers (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "domains" text ARRAY NOT NULL DEFAULT '{}',
    "iconURL" text NOT NULL,
    "nuxText" text,
    "mergeHashWithLocation" boolean NOT NULL DEFAULT FALSE,
    "disableAnnotations" boolean NOT NULL DEFAULT FALSE,
    "visibleInDiscoverToolsSection" boolean NOT NULL DEFAULT TRUE,
    "dirty" boolean NOT NULL DEFAULT TRUE,
    "claimingApplication" uuid REFERENCES applications (id) ON DELETE SET NULL
);

ALTER TABLE applications
    ADD FOREIGN KEY ("defaultProvider")
    REFERENCES providers ("id")
    ON DELETE SET NULL;

CREATE TYPE provider_rule_type AS ENUM (
    'deny',
    'allow'
);

CREATE TABLE provider_rules (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "providerID" uuid NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    "type" provider_rule_type NOT NULL,
    "order" smallint NOT NULL,
    "matchPatterns" jsonb NOT NULL,
    "observeDOMMutations" boolean NOT NULL DEFAULT FALSE,
    "nameTemplate" text,
    "contextTransformation" jsonb NOT NULL DEFAULT '{"type": "default"}' ::jsonb,
    UNIQUE ("providerID", "order") DEFERRABLE INITIALLY DEFERRED
);

CREATE TYPE provider_document_mutator_type AS ENUM (
    'custom_css',
    'fixed_elements',
    'default_css'
);

CREATE TABLE provider_document_mutators (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "providerID" uuid NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    "type" provider_document_mutator_type NOT NULL,
    "config" jsonb
);

CREATE TYPE provider_rule_match_status AS enum (
    'deny',
    'allow',
    'none'
);

CREATE TABLE provider_rule_tests (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 () PRIMARY KEY,
    "providerID" uuid NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    "url" text NOT NULL,
    "documentHTML" text,
    "expectedMatch" provider_rule_match_status NOT NULL,
    "expectedContextData" jsonb,
    "expectedName" text
);

CREATE OR REPLACE VIEW "providers_view" AS
WITH dm AS (
    SELECT
        provider_document_mutators. "providerID",
        jsonb_agg(((row_to_json(provider_document_mutators.*))::jsonb - 'providerID'::text)) AS "documentMutators"
    FROM
        provider_document_mutators
    GROUP BY
        provider_document_mutators. "providerID"
),
rules AS (
    SELECT
        provider_rules. "providerID",
        jsonb_agg(((row_to_json(provider_rules.*))::jsonb - ARRAY['providerID'::text, 'order'::text])
ORDER BY provider_rules. "order") AS rules
    FROM
        provider_rules
    GROUP BY
        provider_rules. "providerID"
)
SELECT
    p.id,
    p.name,
    p.domains,
    p. "claimingApplication",
    p. "iconURL",
    p. "nuxText",
    p. "mergeHashWithLocation",
    p. "disableAnnotations",
    p. "visibleInDiscoverToolsSection",
    p.dirty,
    COALESCE(dm. "documentMutators", '[]'::jsonb) AS "documentMutators",
    COALESCE(rules.rules, '[]'::jsonb) AS rules
FROM ((providers p
    LEFT JOIN dm ON ((p.id = dm. "providerID")))
    LEFT JOIN rules ON ((p.id = rules. "providerID")));

CREATE TABLE published_providers (
    "providerID" uuid NOT NULL PRIMARY KEY REFERENCES providers (id),
    "lastPublishedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ruleProvider" jsonb NOT NULL
);

CREATE FUNCTION trigger_provider_dirty_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW.dirty := TRUE;
          RETURN NEW;
      END;
      $$;

CREATE FUNCTION trigger_provider_mark_dirty() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          UPDATE
              cord.providers
          SET
              dirty = 't'
          WHERE
              id IN (OLD."providerID", NEW."providerID");
          RETURN NEW;
      END;
      $$;

CREATE TRIGGER dirty_on_insert_trigger
    AFTER INSERT ON provider_rules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_update_trigger
    AFTER UPDATE ON provider_rules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_delete_trigger
    AFTER DELETE ON provider_rules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_insert_trigger
    AFTER INSERT ON provider_document_mutators
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_update_trigger
    AFTER UPDATE ON provider_document_mutators
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_delete_trigger
    AFTER DELETE ON provider_document_mutators
    FOR EACH ROW
    EXECUTE FUNCTION trigger_provider_mark_dirty ();

CREATE TRIGGER dirty_on_insert_trigger
    BEFORE INSERT ON providers
    FOR EACH ROW
    WHEN (NOT NEW.dirty)
    EXECUTE FUNCTION trigger_provider_dirty_update ();

CREATE TRIGGER dirty_on_update_trigger
    BEFORE UPDATE OF "id",
    "name",
    "domains",
    "iconURL",
    "nuxText",
    "mergeHashWithLocation",
    "disableAnnotations",
    "visibleInDiscoverToolsSection" ON providers
    FOR EACH ROW
    WHEN (NOT OLD.dirty)
    EXECUTE FUNCTION trigger_provider_dirty_update ();

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- PAGES, THREADS AND RELATED TABLES
-- --

CREATE TYPE thread_support_status AS enum (
    'open',
    'closed'
);

CREATE TABLE pages (
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "providerID" uuid REFERENCES providers (id),
    -- This constraint checks that all values in contextData are flat objects with non-null values
    "contextData" jsonb NOT NULL CHECK (NOT "contextData" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),
    "contextHash" uuid NOT NULL,
    PRIMARY KEY ("orgID", "contextHash"),
    UNIQUE ("orgID", "providerID", "contextHash")
);

CREATE INDEX ON pages USING gin("contextData");

CREATE TABLE threads (
    id uuid NOT NULL DEFAULT uuid_generate_v4 () PRIMARY KEY,
    "orgID" uuid NOT NULL REFERENCES orgs ("id") ON DELETE CASCADE,
    name text NOT NULL,
    "resolvedTimestamp" timestamp with time zone,
    "resolverUserID" uuid,
    -- the url of where the thread was initially created
    "url" text NOT NULL,
    "supportStatus" thread_support_status,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageContextHash" uuid NOT NULL,

    "platformApplicationID" UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "externalID" text NOT NULL,
    -- This constraint checks that all values in metadata are flat objects with non-null values
    -- (this is the same check we do for "pages"."contextData")
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),
    "extraClassnames" text,

    -- across a given application, the externalIDs need to be unique
    UNIQUE ("platformApplicationID", "externalID"),

    -- the "id" on its own is unique in this table, of course, but by adding
    -- the following UNIQUE constraint, we can reference this table by
    -- ("orgID", "id"), too
    UNIQUE ("orgID", "id"),
    FOREIGN KEY ("orgID", "pageContextHash") REFERENCES pages ("orgID", "contextHash") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("resolverUserID") REFERENCES users ("id") ON DELETE SET NULL
);
CREATE INDEX ON threads ("resolverUserID");
CREATE INDEX ON threads ("platformApplicationID");
CREATE INDEX ON threads ("orgID", "pageContextHash");
CREATE INDEX ON threads USING gin("metadata");

CREATE TABLE preallocated_thread_ids (
    id uuid NOT NULL DEFAULT uuid_generate_v4 () PRIMARY KEY,
    "platformApplicationID" UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "externalID" text NOT NULL,

    UNIQUE ("platformApplicationID", "externalID")
);

CREATE TABLE thread_participants (
    "threadID" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastSeenTimestamp" timestamp with time zone,
    "lastUnseenMessageTimestamp" timestamp with time zone,
    "lastUnseenReactionTimestamp" timestamp with time zone,
    subscribed boolean NOT NULL DEFAULT TRUE,
    PRIMARY KEY ("threadID", "orgID", "userID"),
    FOREIGN KEY ("orgID") REFERENCES orgs ("id") ON DELETE CASCADE,
    FOREIGN KEY ("userID") REFERENCES users ("id") ON DELETE CASCADE,
    FOREIGN KEY ("orgID", "threadID") REFERENCES threads ("orgID", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ON thread_participants ("orgID", "userID", "threadID");
CREATE INDEX ON thread_participants ("threadID", "userID");
CREATE INDEX ON thread_participants ("userID");

CREATE TABLE page_visitors (
    "pageContextHash" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastPresentTimestamp" timestamp with time zone,
    PRIMARY KEY ("pageContextHash", "orgID", "userID"),
    FOREIGN KEY ("pageContextHash", "orgID") REFERENCES pages ("contextHash", "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("orgID") REFERENCES orgs ("id") ON DELETE CASCADE,
    FOREIGN KEY ("userID") REFERENCES users ("id") ON DELETE CASCADE
);
CREATE INDEX ON page_visitors ("orgID", "userID");
CREATE INDEX ON page_visitors ("userID");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- LOGGING
-- --

CREATE TABLE events (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "pageLoadID" uuid,
    "userID" uuid,
    "orgID" uuid,
    "platformApplicationID" uuid,
    "eventNumber" integer,
    "clientTimestamp" timestamp with time zone,
    "serverTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type text NOT NULL,
    payload jsonb,
    metadata jsonb,
    "installationID" uuid,
    "utmParameters" jsonb,
    version text,
    "tier" tier_type NOT NULL
);

CREATE INDEX ON events ("type", "platformApplicationID");
CREATE INDEX ON events ("type", "serverTimestamp");
CREATE INDEX ON events ("serverTimestamp");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- MESSAGES AND RELATED TABLES
-- --

CREATE TYPE imported_slack_message_type AS ENUM (
    'reply',
    'supportBotReply'
);


CREATE TABLE email_notifications (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "threadOrgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "threadID" uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    "email" text NOT NULL
);
CREATE UNIQUE INDEX ON email_notifications ("id", "threadID", "userID", "threadOrgID");
CREATE INDEX ON email_notifications ("threadID");
CREATE INDEX ON email_notifications ("userID");
CREATE INDEX ON email_notifications ("threadOrgID");
CREATE INDEX ON email_notifications ("orgID");
 
CREATE TYPE message_type AS ENUM (
    'action_message',
    'user_message'
);

CREATE TABLE messages (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    content jsonb NOT NULL,
    "externalID" text NOT NULL,
    "sourceID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    url text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "deletedTimestamp" timestamp with time zone,
    "lastUpdatedTimestamp" timestamp with time zone,
    "importedSlackChannelID" text,
    "importedSlackMessageTS" text,
    "importedSlackMessageType" imported_slack_message_type,
    "importedSlackMessageThreadTS" text,
    "replyToEmailNotificationID" uuid,
    "iconURL" text,
    "translationKey" text,
    "type" message_type NOT NULL DEFAULT 'user_message',
    -- The CHECK constraint on metadata checks that all values in metadata are
    -- flat objects with non-null values (this is the same check we do for
    -- "pages"."contextData", as well as other metadata columns.)
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),
    "extraClassnames" text,
    "contentTsVector" tsvector GENERATED ALWAYS AS (to_tsvector('english', jsonb_path_query_array(content, 'strict $.**.text'))) STORED,
    "skipLinkPreviews" boolean NOT NULL DEFAULT FALSE

    CHECK (num_nulls ("importedSlackChannelID", "importedSlackMessageTS", "importedSlackMessageType") IN (0, 3)),

    -- the "id" on its own is unique in this table, of course, but by adding
    -- the following UNIQUE constraint, we can reference this table by
    -- ("orgID", "id"), too
    UNIQUE ("orgID", "id"),
    UNIQUE ("externalID", "platformApplicationID"),

    FOREIGN KEY ("orgID") REFERENCES orgs ("id") ON DELETE CASCADE,
    FOREIGN KEY ("sourceID") REFERENCES users ("id") ON DELETE CASCADE,
    FOREIGN KEY ("orgID", "threadID") REFERENCES threads ("orgID", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("replyToEmailNotificationID", "threadID", "sourceID", "orgID") REFERENCES email_notifications ("id", "threadID", "userID", "threadOrgID") DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("platformApplicationID") REFERENCES applications ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX thread_messages_imported_slack ON messages
    USING btree ( "orgID", "threadID", "importedSlackChannelID", "importedSlackMessageTS")
    WHERE "importedSlackChannelID" IS NOT NULL;
CREATE INDEX ON messages ("threadID", "timestamp");
CREATE INDEX ON messages ("orgID", "sourceID");
CREATE INDEX ON messages ("sourceID");
CREATE INDEX ON messages USING gin("metadata");
CREATE INDEX ON messages USING gin("contentTsVector");
CREATE INDEX ON messages ("platformApplicationID");

CREATE OR REPLACE FUNCTION cord.add_external_id_if_null() RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
      BEGIN
          IF NEW."externalID" IS NULL THEN
              NEW."externalID" := 'cord:' || NEW.id;
          END IF;
          RETURN NEW;
      END;
      $$;

CREATE TRIGGER add_message_external_id_trigger
    BEFORE INSERT ON cord.messages
    FOR EACH ROW
    EXECUTE FUNCTION cord.add_external_id_if_null();

CREATE TRIGGER add_thread_external_id_trigger
    BEFORE INSERT ON cord.threads
    FOR EACH ROW
    EXECUTE FUNCTION cord.add_external_id_if_null();

CREATE TRIGGER add_user_external_id_trigger
    BEFORE INSERT ON cord.users
    FOR EACH ROW
    EXECUTE FUNCTION cord.add_external_id_if_null();

CREATE TABLE message_attachments (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    type text NOT NULL,
    data jsonb NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON message_attachments ("messageID");

CREATE TABLE message_reactions (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    -- NB: the frontend enforces a much stricter limit than this, which is just
    -- a fallback, and so that we don't have to do a db migration if we want to
    -- give a little more length in the frontend. Also node and postgres count
    -- unicode slightly differently (?)
    "unicodeReaction" text NOT NULL CHECK (length("unicodeReaction") < 4096),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userID") REFERENCES users ("id") ON DELETE CASCADE,
    UNIQUE ("userID", "messageID", "unicodeReaction")
);
CREATE INDEX ON message_reactions ("messageID");
CREATE INDEX ON message_reactions ("userID");

CREATE TABLE message_mentions (
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userID", "messageID")
);
CREATE INDEX ON message_mentions ("messageID", "userID");
CREATE INDEX ON message_mentions ("userID");

CREATE TYPE message_notifications_type AS ENUM (
    'slack',
    'email',
    'slackEmailMatched',
    'sharedToSlackChannel',
    'sharedToEmail'
);

CREATE TABLE message_link_previews(
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    "lastScrapedTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" text NOT NULL,
    "url_hash" text,
    "img" text,
    "title" text,
    "description" text,
    "hidden" boolean NOT NULL DEFAULT FALSE,
    UNIQUE("messageID", "url")
);

CREATE INDEX ON message_link_previews ("messageID");


-- Table to store urls of mentions for us to track any link clicks
CREATE TABLE message_notifications (
    -- Using nano id instead of UUID to get a shorter length for link param
    id TEXT NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    type message_notifications_type NOT NULL,
    url text NOT NULL,
    location jsonb, -- i.e. contextData
    "targetUserID" uuid REFERENCES users (id) ON DELETE CASCADE,
    "targetOrgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" jsonb NOT NULL default '{}',
    -- Eventually want to make sharerUserID and sharerOrgID not nullable as
    -- we will start to always store these.
    "sharerUserID" uuid,
    "sharerOrgID" uuid
);
CREATE INDEX ON message_notifications ("messageID");
CREATE INDEX ON message_notifications ("targetOrgID", "targetUserID");
CREATE INDEX ON message_notifications ("targetUserID");

-- The `files` table is referenced from `message_attachments` (not formally,
-- but from within the JSON data)
-- TODO: turn uploadStatus into an enum
CREATE TABLE files (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL,
    "platformApplicationID" uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "mimeType" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name text,
    size integer DEFAULT 0,
    "s3Bucket" uuid,
    "uploadStatus" text NOT NULL DEFAULT 'uploading',
    FOREIGN KEY ("userID") REFERENCES users ("id") ON DELETE CASCADE,
    FOREIGN KEY ("s3Bucket") REFERENCES "s3_buckets" ("id")
);
CREATE INDEX ON files ("userID");

CREATE TABLE user_hidden_annotations (
    "userID" uuid NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "annotationID" uuid NOT NULL REFERENCES message_attachments ("id") ON DELETE CASCADE,
    "orgID" uuid NOT NULL,
    "pageContextHash" uuid NOT NULL,
    PRIMARY KEY ("userID", "annotationID"),
    FOREIGN KEY ("orgID", "pageContextHash") REFERENCES pages ("orgID", "contextHash") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ON user_hidden_annotations ("userID", "orgID", "pageContextHash");
CREATE INDEX ON user_hidden_annotations ("annotationID");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- SLACK RELATED TABLES
-- --

CREATE TABLE slack_channels (
    "orgID" uuid NOT NULL,
    "slackID" text NOT NULL,
    name text NOT NULL,
    added boolean NOT NULL DEFAULT FALSE,
    archived boolean NOT NULL DEFAULT FALSE,
    "users" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("orgID", "slackID")
);

CREATE TABLE slack_messages (
    "slackOrgID" uuid NOT NULL,
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "messageID" uuid NOT NULL,
    "sharerOrgID" uuid NOT NULL,
    "sharerUserID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("slackOrgID", "slackChannelID", "slackMessageTimestamp"),
    FOREIGN KEY ("messageID") REFERENCES messages ("id") ON DELETE CASCADE,
    FOREIGN KEY ("sharerOrgID") REFERENCES orgs ("id") ON DELETE CASCADE,
    FOREIGN KEY ("sharerUserID") REFERENCES users ("id") ON DELETE CASCADE
);

CREATE INDEX ON slack_messages ("messageID");
CREATE INDEX ON slack_messages ("sharerOrgID", "sharerUserID");

CREATE TABLE slack_mirrored_threads (
    "threadID" uuid NOT NULL PRIMARY KEY,
    "threadOrgID" uuid NOT NULL REFERENCES orgs ("id") ON DELETE CASCADE,
    "slackOrgID" uuid NOT NULL REFERENCES orgs ("id") ON DELETE CASCADE,
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("threadID", "threadOrgID") REFERENCES threads("id", "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE UNIQUE INDEX ON slack_mirrored_threads ("slackOrgID", "slackChannelID", "slackMessageTimestamp");
CREATE INDEX ON slack_mirrored_threads ("threadID");

CREATE TABLE slack_mirrored_support_threads (
    "threadID" uuid NOT NULL PRIMARY KEY,
    "threadOrgID" uuid NOT NULL REFERENCES orgs ("id") ON DELETE CASCADE,
    "slackOrgID" uuid NOT NULL REFERENCES orgs ("id") ON DELETE CASCADE,
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("threadID", "threadOrgID") REFERENCES threads("id", "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE UNIQUE INDEX ON slack_mirrored_support_threads ("slackOrgID", "slackChannelID", "slackMessageTimestamp");
CREATE INDEX ON slack_mirrored_support_threads ("threadID");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- TASK RELATED TABLES
-- --

CREATE TABLE tasks (
    id uuid NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    done boolean NOT NULL,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneStatusLastUpdatedBy" uuid
);
CREATE INDEX ON tasks ("messageID");

CREATE TABLE task_assignees (
    "taskID" uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignerID" uuid REFERENCES users (id) ON DELETE SET NULL,
    PRIMARY KEY ("userID", "taskID")
);
CREATE INDEX ON task_assignees ("taskID");
CREATE INDEX ON task_assignees ("orgID", "userID");
CREATE INDEX ON task_assignees ("orgID", "assignerID");

CREATE TABLE task_todos (
    id uuid NOT NULL PRIMARY KEY,
    "taskID" uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    done boolean NOT NULL,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON task_todos ("taskID");

CREATE TYPE "third_party_connection_type" AS enum (
    'jira',
    'asana',
    'linear',
    'trello',
    'monday'
);

CREATE TABLE "third_party_connections" (
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "type" third_party_connection_type NOT NULL,
    "externalID" text NOT NULL,
    "externalEmail" text NOT NULL,
    "externalAuthData" jsonb,
    "connectedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("orgID", "userID", "type")
);

CREATE TABLE "task_third_party_references" (
    "taskID" uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    "externalID" text NOT NULL,
    "externalConnectionType" third_party_connection_type NOT NULL,
    "taskTodoID" uuid REFERENCES task_todos (id) ON DELETE CASCADE,
    "externalLocationID" text,
    "previewData" jsonb,
    "imported" boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("taskID", "externalID", "externalConnectionType")
);
CREATE INDEX ON task_third_party_references ("taskTodoID");

CREATE TABLE task_third_party_subscriptions (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
    "externalConnectionType" third_party_connection_type NOT NULL,
    "subscriptionDetails" jsonb NOT NULL,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- METRICS
-- --

-- For the purpose of our metrics, we want days to start at 6am UTC. This
-- function calculates the metric day from a timestamp.
CREATE FUNCTION metrics_day(ts timestamp with time zone)
    RETURNS date IMMUTABLE AS $$
      BEGIN
          RETURN ((ts AT TIME ZONE 'UTC') - '6 hours'::interval)::date;
      END;
      $$ LANGUAGE plpgsql;


CREATE TABLE application_usage_metric_types (
    "id" uuid DEFAULT uuid_generate_v4 () NOT NULL,
    "metric" text NOT NULL CHECK ("metric" != ''),
    PRIMARY KEY ("id") INCLUDE ("metric"),
    UNIQUE ("metric") INCLUDE ("id")
);

CREATE TABLE application_usage_metrics (
    "applicationID" uuid NOT NULL
      REFERENCES applications (id) ON DELETE CASCADE,
    "metricID" uuid NOT NULL
      REFERENCES application_usage_metric_types (id) ON DELETE CASCADE,
    "date" date NOT NULL,
    "value" integer NOT NULL,
    PRIMARY KEY ("applicationID", "metricID", "date")
);

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- NOTIFICATIONS
-- --

CREATE TYPE notification_read_status AS enum (
  'unread',
  'read'
);

CREATE TYPE notification_type AS enum (
  'reply',
  'reaction',
  'external',
  'thread_action'
);

CREATE TYPE thread_action_type AS enum (
    'resolve',
    'unresolve'
);

CREATE TABLE notifications (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  "platformApplicationID" uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  "externalID" text NOT NULL,
  "recipientID" uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "iconUrl" text,
  "type" notification_type NOT NULL,
  "aggregationKey" text,
  "readStatus" notification_read_status NOT NULL DEFAULT 'unread',
  "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "extraClassnames" text,

  UNIQUE("externalID", "platformApplicationID"),

  -- The CHECK constraint on metadata checks that all values in metadata are
  -- flat objects with non-null values (this is the same check we do for
  -- "pages"."contextData", as well as other metadata columns.)
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")'),

  -- Type-specific columns.
  "senderID" uuid REFERENCES users (id) ON DELETE CASCADE,
  CHECK (("type"::text = 'external' OR "senderID" IS NOT NULL)),
  "messageID" uuid REFERENCES messages (id) ON DELETE CASCADE,
  CHECK (("messageID" IS NULL) = ("type"::text = 'external')),
  "replyActions" text[],
  CHECK (("replyActions" IS NOT NULL) = ("type"::text = 'reply')),
  "reactionID" uuid REFERENCES message_reactions (id) ON DELETE CASCADE,
  CHECK (("reactionID" IS NOT NULL) = ("type"::text = 'reaction')),
  "threadID" uuid REFERENCES threads (id) ON DELETE CASCADE,
  CHECK ("threadID" IS NOT NULL OR "type"::text != 'thread_action'),
  "threadActionType" thread_action_type,
  CHECK (("threadActionType" IS NOT NULL) = ("type"::text = 'thread_action')),
  "externalTemplate" text,
  CHECK (("externalTemplate" IS NOT NULL) = ("type"::text = 'external')),
  "externalURL" text,
  CHECK (("externalURL" IS NOT NULL) = ("type"::text = 'external'))
);

CREATE INDEX ON notifications ("recipientID");
CREATE INDEX ON notifications ("senderID") WHERE "senderID" IS NOT NULL;
CREATE INDEX ON notifications ("messageID") WHERE "messageID" IS NOT NULL;
CREATE INDEX ON notifications ("reactionID") WHERE "reactionID" IS NOT NULL;
CREATE INDEX ON notifications ("threadID") WHERE "threadID" IS NOT NULL;
CREATE INDEX ON notifications USING gin("metadata");

CREATE TRIGGER add_notification_external_id_trigger
  BEFORE INSERT ON cord.notifications
  FOR EACH ROW
  EXECUTE FUNCTION cord.add_external_id_if_null();

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- PERMISSIONS
-- --

CREATE TYPE permission AS enum (
  'thread:read',
  'thread:send-message',
  'thread-participant:read',
  'message:read'
   /*
     If you are adding/removing a value here: note that migra unfortunately does
     not generate a correct migration when you do this. You'll need to
     copy-paste the following incantation and add it to both the "up" and "down"
     part of your migration, immediately above the "DROP TYPE" in both:
         ALTER TABLE "cord"."permission_rules"
             ALTER COLUMN permissions TYPE "cord"."permission"[]
             USING permissions::text::"cord"."permission"[];
   */
);

CREATE TABLE permission_rules (
  id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
  "platformApplicationID" uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  "resourceSelector" jsonpath NOT NULL,
  "userSelector" jsonpath NOT NULL,
  "permissions" permission[] NOT NULL
);

-- The way we use the resourceSelector and userSelector does not put them on the
-- left-hand side of the operator, so an index on them won't help us, but we can
-- at least split by platformApplicationID.
CREATE INDEX ON permission_rules ("platformApplicationID");

-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- VARIOUS
-- --

CREATE TABLE sessions (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "applicationID" uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "issuedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" timestamp with time zone
);
CREATE INDEX ON sessions ("applicationID");

CREATE TABLE email_subscription (
    "userID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    "subscribed" boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("userID", "threadID"),
    FOREIGN KEY ("userID") REFERENCES users ("id") ON DELETE CASCADE,
    FOREIGN KEY ("threadID") REFERENCES threads ("id") ON DELETE CASCADE
);
CREATE INDEX ON email_subscription ("threadID");

-- This table returns configurations that we can modify to make decisions of
-- whether to do stuff.
CREATE TABLE heimdall (
    "tier" tier_type NOT NULL,
    "key" text NOT NULL,
    "value" boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("tier", "key")
);

CREATE TABLE deploys (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "tier" tier_type NOT NULL,
    "deployStartTime" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deployFinishTime" timestamp with time zone,
    "success" boolean,
    "error" text,
    "gitCommitHash" text,
    "dockerImage" text NOT NULL,
    "packageVersion" text,
    "embedJSPath" text,
    "embedJSIntegrity" text,
    "sdkBytes" integer,
    "sdkCompressedBytes" integer
);

-- When we download external assets (like Slack avatar images), we can store
-- here what the hash of the downloaded content was. Below, we will reference
-- external assets by their content hash, and this table functions as a cache,
-- so we don't have to download the asset again and again as we use it. This
-- table contains a timestamp, so we can choose to re-download external assets
-- after some period of time.
CREATE TABLE external_assets (
    -- url from where the asset was downloaded
    "url" text NOT NULL PRIMARY KEY,
    -- time when download happened
    "downloadTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- sha384 hash of the downloaded contents
    "sha384" text NOT NULL
);

-- This table is used to store information on variants of images we created and
-- store in our public S3 bucket. "Variant" here means something like "badged
-- with Cord badge", and the source image would be an avatar image.
CREATE TABLE image_variants (
    -- sha384 hash of the image this variant is based on
    "sourceSha384" text NOT NULL,
    -- description of how the base image was altered
    "variant" text NOT NULL,
    -- time this variant was created
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- filename, i.e. key in our public S3 bucket
    "filename" text NOT NULL,
    PRIMARY KEY ("sourceSha384", "variant")
);

CREATE TABLE admin_go_redirects (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    url text NOT NULL,
    "creatorUserID" UUID NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "updaterUserID" UUID NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "redirectCount" integer NOT NULL DEFAULT 0
);


-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- --
-- -- CUSTOMER REQUEST TRACKER
-- --

CREATE TYPE admin_crt_coming_from AS enum (
    'them',
    'us'
);

CREATE TYPE admin_crt_decision AS enum (
    'done',
    'accepted',
    'rejected',
    'pending'
);

CREATE TYPE admin_crt_communication_status AS enum (
    'none',
    'request_acked',
    'decision_sent',
    'decision_acked'
);

CREATE TYPE admin_crt_issue_type AS enum (
    'request',
    'bug',
    'onboarding_step'
);

CREATE TYPE admin_crt_priority AS enum (
    'blocker',
    'high',
    'low'
);

CREATE TABLE admin_crt_customer_issues (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "customerID" UUID NOT NULL REFERENCES customers ("id") ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    "comingFrom" admin_crt_coming_from NOT NULL,
    decision admin_crt_decision NOT NULL DEFAULT 'pending',
    "communicationStatus" admin_crt_communication_status NOT NULL DEFAULT 'none',
    "lastTouch" timestamp with time zone,
    "type" admin_crt_issue_type NOT NULL DEFAULT 'request',
    "priority" admin_crt_priority NOT NULL DEFAULT 'low',
    "assignee" uuid REFERENCES users ("id") ON DELETE SET NULL,
    "createdTimestamp"  timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externallyVisible" boolean NOT NULL DEFAULT FALSE
);

CREATE INDEX on admin_crt_customer_issues("customerID");

CREATE TABLE admin_crt_customer_issue_changes (
    id uuid DEFAULT uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "issueID" uuid NOT NULL REFERENCES admin_crt_customer_issues (id) ON DELETE CASCADE,
    "userID" uuid NOT NULL REFERENCES users (id),
    "changeDetail" jsonb NOT NULL,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_crt_customer_issue_subscriptions (
    "issueID" uuid NOT NULL REFERENCES admin_crt_customer_issues("id") ON DELETE CASCADE,
    "userID" uuid NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    PRIMARY KEY ("issueID", "userID")
);
CREATE INDEX ON admin_crt_customer_issue_subscriptions("userID", "issueID");

CREATE TABLE warm_demo_users (
    id uuid default uuid_generate_v4 () NOT NULL PRIMARY KEY,
    "demoGroup" text NOT NULL,
    "platformApplicationID" UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    "userID" text NOT NULL,
    "orgID" text NOT NULL,
    version int NOT NULL
);
