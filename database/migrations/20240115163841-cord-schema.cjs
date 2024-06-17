'use strict';

module.exports = {
  up: ({ sequelize }) =>
    sequelize.transaction(
      { isolationLevel: 'SERIALIZABLE' },
      async (transaction) => {
        const names = new Set(
          (
            await sequelize.query('SELECT name FROM public."SequelizeMeta";', {
              type: 'SELECT',
              transaction,
            })
          ).map(({ name }) => name),
        );

        if (originalMigrationNames.every((n) => !names.has(n))) {
          // No original migrations have been applied
          await sequelize.query(dump + setup, { transaction });
        } else if (originalMigrationNames.every((n) => names.has(n))) {
          // All original migrations have been applied before
          await sequelize.query(
            'DELETE FROM public."SequelizeMeta" WHERE name=ANY($1);',
            { bind: [originalMigrationNames], transaction },
          );
        } else {
          throw new Error(
            'Some but not all original migrations have been applied',
          );
        }
      },
    ),
  down: ({ sequelize }) =>
    sequelize.query(`
                DROP SCHEMA IF EXISTS "cord" CASCADE;
                DROP FUNCTION IF EXISTS public.gen_random_uuid();
            `),
};

const originalMigrationNames = [
  '20220729145405-cord-schema.js',
  '20220801121843-reactions-orgID-messageID-constraint.js',
  '20220801125304-add-appID-to-events.js',
  '20220801170049-drop-third-party-task-import-table.js',
  '20220802153919-temp-replace-dropped-table.js',
  '20220803085510-remove-table-scraped-message-links.js',
  '20220803093759-drop_task_import_table.js',
  '20220815134027-add-internal-redirect-uri.js',
  '20220817102925-linked_users_timestamp.js',
  '20220817154110-more_profile_fields.js',
  '20220817154738-application_usage_metrics.js',
  '20220818145349-metrics_day-function.js',
  '20220819104225-add-application-environment.js',
  '20220819115340-backfill-profile-timestamps.js',
  '20220902162200-cleanup-name-timestamps.js',
  '20220905125340-backfill-user-uploaded-info.js',
  '20220906162200-cleanup-name-timestamps-again.js',
  '20220907175024-add-app-slack-field.js',
  '20220908103335-add_indexes_to_events_table.js',
  '20220909151245-creating-customer-type.js',
  '20220909160621-add-sample-application-environment.js',
  '20220912115521-merge-profiles-and-users-pt1.js',
  '20220912115557-merge-profiles-and-users-pt2.js',
  '20220912115610-merge-profiles-and-users-pt3.js',
  '20220914094653-add-lastunseenreactiontimestamp-to-thread-participants.js',
  '20220927142019-add-on-delete-cascade-to-user-referenced-tables.js',
  '20220927142822-set-merger-user-id-to-nullable.js',
  '20220927145003-add-references-to-message-mentions.js',
  '20221005162509-revert-foreign-keys-message-mentions.js',
  '20221006083336-console-user-verified-status.js',
  '20221006134223-add-foreign-keys-to-message-mentions.js',
  '20221010160957-drop-isUpdateLocked.js',
  '20221011095805-restore-isUpdateLocked.js',
  '20221011103352-remove-profiles-view.js',
  '20221011123922-customer-custom-s3-bucket.js',
  '20221011161516-drop-isUpdateLocked-again.js',
  '20221012125942-customer-custom-segment-write-key.js',
  '20221020085619-drop_messages_seen_table.js',
  '20221026103055-add-sampletoken-application-environment.js',
  '20221026145340-set-sampletoken-app-environment.js',
  '20221026153324-create-notifications-table.js',
  '20221031113207-add-sampletoken-customer.js',
  '20221101105740-profile-timestamps-constraint.js',
  '20221101124845-delete-deletions.js',
  '20221108150254-go-redirects.js',
  '20221108161303-notif-add-reactionID.js',
  '20221114173021-redirect-creator.js',
  '20221115161527-add-threads-context-hash-and-timestamp-columns.js',
  '20221115164127-migrate-threads-context-hash-and-timestamp.js',
  '20221115173109-drop-page-threads.js',
  '20221116111613-make-threads-columns-not-null.js',
  '20221212113553-remove-scrapedLink.js',
  '20230104102854-notification-type-constraint.js',
  '20230110150024-external-notifications.js',
  '20230111164757-deploy-sdk-bytes.js',
  '20230117094330-notifications-reply-actions.js',
  '20230117094844-notifications-reply-actions-finalise.js',
  '20230123162851-notifications-index.js',
  '20230124163648-tasks-assignerID-foreignkey.js',
  '20230127104611-message_notifications-fkey-index.js',
  '20230130111640-admin-crt-initial-tables.js',
  '20230130121259-admin-crt-comm-status.js',
  '20230131110511-rename-issues-table.js',
  '20230131110740-messages-threads-fkey-indexes.js',
  '20230131120704-users-fkey-indexes.js',
  '20230131133404-admin-crt-additional-fields.js',
  '20230131142456-users-fkey-indexes-pt2.js',
  '20230131150716-users-unique-platformApplicationID-externalID.js',
  '20230201115033-add-deafults-to-type-and-priotity-customer-issues.js',
  '20230201131821-applications-fkeys.js',
  '20230201135327-add-customer-slack-channel.js',
  '20230201142813-visibility.js',
  '20230201151226-drop-table-external_user_puppet_sessions.js',
  '20230202104931-third-party-connections-orgID-cascade.js',
  '20230202143920-add-issue-changes.js',
  '20230203232954-addCustomerIDIndex.js',
  '20230208170137-allowing-reset-profile-pic-null.js',
  '20230213165808-message_content_text.js',
  '20230214110635-fix-message_content_text.js',
  '20230215113648-add-default-logo-config-to-existing-applications.js',
  '20230220105842-crtSubscriptions.js',
  '20230222094353-inactive-customers.js',
  '20230227112046-convert-empty-objects-to-null-in-applications.js',
  '20230307115335-drop-name-columns.js',
  '20230309135942-drop-console-user-applications.js',
  '20230321122343-add-threads-metadata.js',
  '20230327162945-allow-less-strict-metadata-values.js',
  '20230330102742-make-thread-metadata-non-null.js',
  '20230330124025-add-metadata-to-notifications.js',
  '20230412000000-delete-pref-sidebar-visible-context.js',
  '20230413104458-add-metadata-to-users.js',
  '20230421200105-external-id-on-message.js',
  '20230425220821-application-webhook.js',
  '20230428154619-customer-shared-secret.js',
  '20230509102039-message-external-id-trigger.js',
  '20230510170555-thread-external-id-trigger.js',
  '20230512110457-applications-deleted-timestamp.js',
  '20230512193911-app-id-in-messages.js',
  '20230516075104-org_deletion.js',
  '20230516093439-adding-app-id-to-threads.js',
  '20230516093845-backfilling-thread-external-ids.js',
  '20230516094222-adding-app-id-to-extension-threads.js',
  '20230517152134-app-id-not-null-in-messages.js',
  '20230517163630-drop-deletedTimestamp.js',
  '20230517170237-uniqueness-constraint-on-message-external-id-app-id.js',
  '20230518084348-cascade-app-deletion.js',
  '20230519082457-remove-chrome-extension.js',
  '20230519155112-add-user-externalid-trigger.js',
  '20230519160127-add-anonymize-to-user-and-org-member-state-enum-types.js',
  '20230519161711-backfilling-user-external-ids.js',
  '20230519162611-make-users-external-id-not-nullable.js',
  '20230522091025-drop-message-versions.js',
  '20230523133905-remove-platform-user-member-table.js',
  '20230524102910-add-icon-to-notification.js',
  '20230526123832-reaction-org-optional.js',
  '20230526202654-drop-user-specified-profile-columns.js',
  '20230528201142-action-messages.js',
  '20230530102746-notification-sender-nullable.js',
  '20230530104532-reaction-org-drop.js',
  '20230530133135-drop-message-page-context-hash.js',
  '20230531145354-defer-orgid-fks.js',
  '20230531154056-notif-add-platformapplicationid.js',
  '20230602125823-threads-external-id-not-null.js',
  '20230605093721-notif-require-platformapplicationid.js',
  '20230605123636-notif-add-externalid.js',
  '20230605164216-add-metadata-to-messages.js',
  '20230606124449-no-thread-resolved-unresolved.js',
  '20230619155935-drop-last-invited-timestamp.js',
  '20230623084910-messages-external-id-not-null.js',
  '20230629105119-consolidate-org-unique-index.js',
  '20230705124254-add-webhooksubs-to-applications.js',
  '20230707132656-addExtraClassnamesToMessage.js',
  '20230713135333-thread_add_extraClassnames.js',
  '20230721133346-add-extra-classnames-to-notification.js',
  '20230721142754-remove-internal-redirect-uri.js',
  '20230721181740-remove_anonymized_status.js',
  '20230721181745-remove_anonymized_status_org_members.js',
  '20230804093353-users-updated-timestamp.js',
  '20230817135153-add_signup_coupon_to_customer.js',
  '20230821135312-add-more-indexes.js',
  '20230822123320-add-searchable-index-field-on-messagess.js',
  '20230823092425-index_pages_contextdata.js',
  '20230825142907-revert-index-addition.js',
  '20230828130049-add_link_preview_table.js',
  '20230831103110-add-auth0-id-column-console-users.js',
  '20230905101631-add_webhooks_table.js',
  '20230907095039-files-add-application-id.js',
  '20230911151004-files-org-id-null.js',
  '20230912110404-files-drop-org-id.js',
  '20230913095712-warm-demo-users-table.js',
  '20230914105905-files-require-app-id.js',
  '20230921135853-customer-cascade-delete.js',
  '20230922092013-hide_link_previews.js',
  '20230926222202-linked-orgs-fkey-delete.js',
  '20230927084018-add_url_hash_to_link_previews.js',
  '20231003153828-add-customer-access-status-column.js',
  '20231005092140-backfill-and-add-checks-to-console-users.js',
  '20231009105839-preallocated-thread-ids-table.js',
  '20231018154818-remove-constraint-console-users.js',
  '20231019124228-lower-names-index.js',
  '20231019124332-add-console-user-constraint.js',
  '20231019141402-drop-customer-access-status-column.js',
  '20231023130003-remove_foreign_key_from_message_notifications.js',
  '20231023142523-remove_foreign_key_from_linked_orgs.js',
  '20231023143626-remove_foreign_key_from_linked_users.js',
  '20231101111252-messages-add-translation-key.js',
  '20231102120000-backfill-translation-key.js',
  '20231106110223-users-index-slack-users.js',
  '20231106171126-users-index-updated-timestamp.js',
  '20231107112615-user-drop-old-columns.js',
  '20231113164756-create-table-permission-rules.js',
  '20231114135350-delete-deleted-org-members.js',
  '20231115233852-remover-org-member-state.js',
  '20231117095047-skip_link_previews_field_in_message.js',
  '20231121150525-reaction_notifications_have_message_id.js',
  '20231121152420-reaction_notifications_bring_back_check.js',
  '20231127104756-notifs-add-message-index.js',
  '20231201114611-add-message-read-permission.js',
  '20231205143959-add-thread-send-message-permission.js',
  '20231211141640-add-defferable-to-slack-mirror-thread-tables.js',
  '20231213162430-add-defer-constraint-messages-foreign-key.js',
  '20240103172542-add-demo-apps-app-type.js',
  '20240103180000-add-demosappstoken-customer.js',
  '20240109104323-add_columns_for_billing_in_customers.js',
  '20240111151833-billing_status_is_string.js',
  '20240112120640-add-metadata-to-groups.js',
  '20240115163840-delete-playground-app.js',
];

const dump = `SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
CREATE SCHEMA cord;
CREATE TYPE cord.admin_crt_coming_from AS ENUM (
    'them',
    'us'
);
CREATE TYPE cord.admin_crt_communication_status AS ENUM (
    'none',
    'request_acked',
    'decision_sent',
    'decision_acked'
);
CREATE TYPE cord.admin_crt_decision AS ENUM (
    'done',
    'accepted',
    'rejected',
    'pending'
);
CREATE TYPE cord.admin_crt_issue_type AS ENUM (
    'request',
    'bug',
    'onboarding_step'
);
CREATE TYPE cord.admin_crt_priority AS ENUM (
    'blocker',
    'high',
    'low'
);
CREATE TYPE cord.application_environment AS ENUM (
    'production',
    'staging',
    'sample',
    'sampletoken',
    'demo'
);
CREATE TYPE cord.application_tier AS ENUM (
    'free',
    'starter',
    'premium'
);
CREATE TYPE cord.billing_type AS ENUM (
    'stripe',
    'manual'
);
CREATE TYPE cord.customer_access_status AS ENUM (
    'pending',
    'approved'
);
CREATE TYPE cord.customer_implementation_stage AS ENUM (
    'launched',
    'implementing',
    'proof_of_concept',
    'inactive'
);
CREATE TYPE cord.customer_type AS ENUM (
    'verified',
    'sample'
);
CREATE TYPE cord.imported_slack_message_type AS ENUM (
    'reply',
    'supportBotReply'
);
CREATE TYPE cord.message_notifications_type AS ENUM (
    'slack',
    'email',
    'slackEmailMatched',
    'sharedToSlackChannel',
    'sharedToEmail'
);
CREATE TYPE cord.message_type AS ENUM (
    'action_message',
    'user_message'
);
CREATE TYPE cord.notification_read_status AS ENUM (
    'unread',
    'read'
);
CREATE TYPE cord.notification_type AS ENUM (
    'reply',
    'reaction',
    'external'
);
CREATE TYPE cord.org_external_provider_type AS ENUM (
    'slack',
    'platform'
);
CREATE TYPE cord.org_state AS ENUM (
    'inactive',
    'active'
);
CREATE TYPE cord.permission AS ENUM (
    'thread:read',
    'thread:send-message',
    'message:read'
);
CREATE TYPE cord.pricing_tier AS ENUM (
    'free',
    'pro',
    'scale'
);
CREATE TYPE cord.profile_external_provider_type AS ENUM (
    'slack',
    'platform'
);
CREATE TYPE cord.provider_document_mutator_type AS ENUM (
    'custom_css',
    'fixed_elements',
    'default_css'
);
CREATE TYPE cord.provider_rule_match_status AS ENUM (
    'deny',
    'allow',
    'none'
);
CREATE TYPE cord.provider_rule_type AS ENUM (
    'deny',
    'allow'
);
CREATE TYPE cord.third_party_connection_type AS ENUM (
    'jira',
    'asana',
    'linear',
    'trello',
    'monday'
);
CREATE TYPE cord.thread_support_status AS ENUM (
    'open',
    'closed'
);
CREATE TYPE cord.tier_type AS ENUM (
    'prod',
    'staging',
    'test',
    'dev',
    'loadtest'
);
CREATE TYPE cord.user_state AS ENUM (
    'active',
    'deleted'
);
CREATE TYPE cord.user_type AS ENUM (
    'person',
    'bot'
);
CREATE FUNCTION cord.add_external_id_if_null() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          IF NEW."externalID" IS NULL THEN
              NEW."externalID" := 'cord:' || NEW.id;
          END IF;
          RETURN NEW;
      END;
      $$;
CREATE FUNCTION cord.message_content_text(content jsonb) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
      $$;
CREATE FUNCTION cord.metrics_day(ts timestamp with time zone) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      BEGIN
          RETURN ((ts AT TIME ZONE 'UTC') - '6 hours'::interval)::date;
      END;
      $$;
CREATE FUNCTION cord.trigger_provider_dirty_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW.dirty := TRUE;
          RETURN NEW;
      END;
      $$;
CREATE FUNCTION cord.trigger_provider_mark_dirty() RETURNS trigger
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
CREATE FUNCTION cord.user_update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW."updatedTimestamp" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE cord.admin_chat_channels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL
);
CREATE TABLE cord.admin_crt_customer_issue_changes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "issueID" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "changeDetail" jsonb NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE cord.admin_crt_customer_issue_subscriptions (
    "issueID" uuid NOT NULL,
    "userID" uuid NOT NULL
);
CREATE TABLE cord.admin_crt_customer_issues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerID" uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    "comingFrom" cord.admin_crt_coming_from NOT NULL,
    decision cord.admin_crt_decision DEFAULT 'pending'::cord.admin_crt_decision NOT NULL,
    "lastTouch" timestamp with time zone,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "communicationStatus" cord.admin_crt_communication_status DEFAULT 'none'::cord.admin_crt_communication_status NOT NULL,
    assignee uuid,
    priority cord.admin_crt_priority DEFAULT 'low'::cord.admin_crt_priority NOT NULL,
    type cord.admin_crt_issue_type DEFAULT 'request'::cord.admin_crt_issue_type NOT NULL,
    "externallyVisible" boolean DEFAULT false NOT NULL
);
CREATE TABLE cord.admin_go_redirects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "redirectCount" integer DEFAULT 0 NOT NULL,
    "creatorUserID" uuid NOT NULL,
    "updaterUserID" uuid NOT NULL
);
CREATE TABLE cord.application_usage_metric_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    metric text NOT NULL,
    CONSTRAINT application_usage_metric_types_metric_check CHECK ((metric <> ''::text))
);
CREATE TABLE cord.application_usage_metrics (
    "applicationID" uuid NOT NULL,
    "metricID" uuid NOT NULL,
    date date NOT NULL,
    value integer NOT NULL
);
CREATE TABLE cord.application_webhooks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "eventWebhookURL" text NOT NULL,
    "eventWebhookSubscriptions" text[]
);
CREATE TABLE cord.applications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    "sharedSecret" text DEFAULT encode(sha256(((public.uuid_generate_v4())::text)::bytea), 'hex'::text) NOT NULL,
    "customColors" jsonb,
    "customEmailTemplate" jsonb,
    "customLinks" jsonb,
    "customS3Bucket" uuid,
    "segmentWriteKey" text,
    "customNUX" jsonb,
    "iconURL" text,
    type cord.application_tier DEFAULT 'free'::cord.application_tier NOT NULL,
    "supportBotID" uuid,
    "supportOrgID" uuid,
    "supportSlackChannelID" text,
    "defaultProvider" uuid,
    "redirectURI" text,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "customerID" uuid NOT NULL,
    environment cord.application_environment DEFAULT 'production'::cord.application_environment NOT NULL,
    "slackConnectAllOrgs" boolean DEFAULT false NOT NULL,
    "eventWebhookURL" text,
    "eventWebhookSubscriptions" text[]
);
CREATE TABLE cord.console_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text,
    email text NOT NULL,
    picture text,
    "customerID" uuid,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "auth0UserID" text,
    "pendingCustomerID" uuid,
    CONSTRAINT console_users_check CHECK (((("pendingCustomerID" IS NULL) <> ("customerID" IS NULL)) OR (("pendingCustomerID" IS NULL) AND ("customerID" IS NULL))))
);
CREATE TABLE cord.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type cord.customer_type DEFAULT 'verified'::cord.customer_type NOT NULL,
    "enableCustomS3Bucket" boolean DEFAULT false NOT NULL,
    "enableCustomSegmentWriteKey" boolean DEFAULT false NOT NULL,
    "implementationStage" cord.customer_implementation_stage DEFAULT 'proof_of_concept'::cord.customer_implementation_stage NOT NULL,
    "launchDate" timestamp with time zone,
    "slackChannel" text,
    "sharedSecret" text DEFAULT encode(sha256(((public.uuid_generate_v4())::text)::bytea), 'hex'::text) NOT NULL,
    "signupCoupon" text,
    addons jsonb DEFAULT '{}'::jsonb NOT NULL,
    "billingStatus" text DEFAULT 'inactive'::text NOT NULL,
    "billingType" cord.billing_type,
    "pricingTier" cord.pricing_tier DEFAULT 'free'::cord.pricing_tier NOT NULL,
    "stripeCustomerID" text,
    CONSTRAINT customers_addons_check CHECK ((NOT (addons @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.deploys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tier cord.tier_type NOT NULL,
    "deployStartTime" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deployFinishTime" timestamp with time zone,
    success boolean,
    error text,
    "gitCommitHash" text,
    "dockerImage" text NOT NULL,
    "packageVersion" text,
    "embedJSPath" text,
    "embedJSIntegrity" text,
    "sdkBytes" integer,
    "sdkCompressedBytes" integer
);
CREATE TABLE cord.email_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    email text NOT NULL,
    "threadOrgID" uuid NOT NULL
);
CREATE TABLE cord.email_subscription (
    "userID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    subscribed boolean DEFAULT false NOT NULL
);
CREATE TABLE cord.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "pageLoadID" uuid,
    "userID" uuid,
    "orgID" uuid,
    "eventNumber" integer,
    "clientTimestamp" timestamp with time zone,
    "serverTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type text NOT NULL,
    payload jsonb,
    metadata jsonb,
    "installationID" uuid,
    version text,
    "utmParameters" jsonb,
    tier cord.tier_type NOT NULL,
    "platformApplicationID" uuid
);
CREATE TABLE cord.external_assets (
    url text NOT NULL,
    "downloadTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sha384 text NOT NULL
);
CREATE TABLE cord.files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userID" uuid NOT NULL,
    "mimeType" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name text,
    size integer DEFAULT 0,
    "uploadStatus" text DEFAULT 'uploading'::text NOT NULL,
    "s3Bucket" uuid,
    "platformApplicationID" uuid NOT NULL
);
CREATE TABLE cord.heimdall (
    tier cord.tier_type NOT NULL,
    key text NOT NULL,
    value boolean DEFAULT false NOT NULL
);
CREATE TABLE cord.image_variants (
    "sourceSha384" text NOT NULL,
    variant text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    filename text NOT NULL
);
CREATE TABLE cord.invites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orgID" uuid NOT NULL,
    "creatorUserID" uuid NOT NULL,
    "invitedUserID" uuid,
    "validUntilTimestamp" timestamp with time zone NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE cord.linked_orgs (
    "sourceOrgID" uuid NOT NULL,
    "sourceExternalProvider" cord.org_external_provider_type NOT NULL,
    "linkedOrgID" uuid NOT NULL,
    "linkedExternalProvider" cord.org_external_provider_type NOT NULL,
    "mergerUserID" uuid,
    "linkedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT linked_orgs_check CHECK (("sourceOrgID" <> "linkedOrgID")),
    CONSTRAINT "linked_orgs_linkedExternalProvider_check" CHECK (("linkedExternalProvider" <> 'platform'::cord.org_external_provider_type)),
    CONSTRAINT "linked_orgs_sourceExternalProvider_check" CHECK (("sourceExternalProvider" = 'platform'::cord.org_external_provider_type))
);
CREATE TABLE cord.linked_users (
    "sourceUserID" uuid NOT NULL,
    "linkedUserID" uuid NOT NULL,
    "linkedOrgID" uuid NOT NULL,
    "sourceOrgID" uuid NOT NULL,
    "linkedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT linked_users_check CHECK (("sourceUserID" <> "linkedUserID"))
);
CREATE TABLE cord.message_attachments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageID" uuid NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cord.message_link_previews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageID" uuid NOT NULL,
    "lastScrapedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    url text NOT NULL,
    img text,
    title text,
    description text,
    hidden boolean DEFAULT false NOT NULL,
    url_hash text
);
CREATE TABLE cord.message_mentions (
    "userID" uuid NOT NULL,
    "messageID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE cord.message_notifications (
    id text NOT NULL,
    "messageID" uuid NOT NULL,
    type cord.message_notifications_type NOT NULL,
    url text NOT NULL,
    "targetOrgID" uuid NOT NULL,
    "targetUserID" uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sharerOrgID" uuid,
    "sharerUserID" uuid,
    location jsonb
);
CREATE TABLE cord.message_reactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userID" uuid NOT NULL,
    "messageID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "unicodeReaction" text NOT NULL
);
CREATE TABLE cord.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content jsonb NOT NULL,
    "sourceID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    url text,
    "deletedTimestamp" timestamp with time zone,
    "lastUpdatedTimestamp" timestamp with time zone,
    "importedSlackChannelID" text,
    "importedSlackMessageTS" text,
    "importedSlackMessageType" cord.imported_slack_message_type,
    "importedSlackMessageThreadTS" text,
    "replyToEmailNotificationID" uuid,
    type cord.message_type DEFAULT 'user_message'::cord.message_type NOT NULL,
    "externalID" text NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "iconURL" text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "extraClassnames" text,
    "contentTsVector" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, jsonb_path_query_array(content, 'strict $.**."text"'::jsonpath))) STORED,
    "translationKey" text,
    "skipLinkPreviews" boolean DEFAULT false NOT NULL,
    CONSTRAINT messages_check CHECK ((num_nulls("importedSlackChannelID", "importedSlackMessageTS", "importedSlackMessageType") = ANY (ARRAY[0, 3]))),
    CONSTRAINT messages_metadata_check CHECK ((NOT (metadata @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "recipientID" uuid NOT NULL,
    "senderID" uuid,
    type cord.notification_type NOT NULL,
    "aggregationKey" text,
    "readStatus" cord.notification_read_status DEFAULT 'unread'::cord.notification_read_status NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "messageID" uuid,
    "reactionID" uuid,
    "externalTemplate" text,
    "externalURL" text,
    "replyActions" text[],
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "iconUrl" text,
    "platformApplicationID" uuid NOT NULL,
    "externalID" text NOT NULL,
    "extraClassnames" text,
    CONSTRAINT notifications_check CHECK ((((type)::text = 'external'::text) OR ("senderID" IS NOT NULL))),
    CONSTRAINT notifications_check1 CHECK ((("messageID" IS NOT NULL) = (((type)::text = 'reply'::text) OR ((type)::text = 'reaction'::text)))),
    CONSTRAINT notifications_check2 CHECK ((("replyActions" IS NOT NULL) = ((type)::text = 'reply'::text))),
    CONSTRAINT notifications_check3 CHECK ((("reactionID" IS NOT NULL) = ((type)::text = 'reaction'::text))),
    CONSTRAINT notifications_check4 CHECK ((("externalTemplate" IS NOT NULL) = ((type)::text = 'external'::text))),
    CONSTRAINT notifications_check5 CHECK ((("externalURL" IS NOT NULL) = ((type)::text = 'external'::text))),
    CONSTRAINT notifications_metadata_check CHECK ((NOT (metadata @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.org_members (
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL
);
CREATE TABLE cord.orgs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    "imageURL" text,
    "externalID" text NOT NULL,
    "externalProvider" cord.org_external_provider_type NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    state cord.org_state NOT NULL,
    "externalAuthData" jsonb,
    domain text,
    "platformApplicationID" uuid,
    internal boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT orgs_check CHECK ((("externalProvider" = 'platform'::cord.org_external_provider_type) = ("platformApplicationID" IS NOT NULL))),
    CONSTRAINT orgs_metadata_check CHECK ((NOT (metadata @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.page_visitors (
    "pageContextHash" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastPresentTimestamp" timestamp with time zone
);
CREATE TABLE cord.pages (
    "orgID" uuid NOT NULL,
    "providerID" uuid,
    "contextData" jsonb NOT NULL,
    "contextHash" uuid NOT NULL,
    CONSTRAINT "pages_contextData_check" CHECK ((NOT ("contextData" @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.permission_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "resourceSelector" jsonpath NOT NULL,
    "userSelector" jsonpath NOT NULL,
    permissions cord.permission[] NOT NULL
);
CREATE TABLE cord.preallocated_thread_ids (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "externalID" text NOT NULL
);
CREATE TABLE cord.provider_document_mutators (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "providerID" uuid NOT NULL,
    type cord.provider_document_mutator_type NOT NULL,
    config jsonb
);
CREATE TABLE cord.provider_rule_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "providerID" uuid NOT NULL,
    url text NOT NULL,
    "documentHTML" text,
    "expectedMatch" cord.provider_rule_match_status NOT NULL,
    "expectedContextData" jsonb,
    "expectedName" text
);
CREATE TABLE cord.provider_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "providerID" uuid NOT NULL,
    type cord.provider_rule_type NOT NULL,
    "order" smallint NOT NULL,
    "matchPatterns" jsonb NOT NULL,
    "observeDOMMutations" boolean DEFAULT false NOT NULL,
    "nameTemplate" text,
    "contextTransformation" jsonb DEFAULT '{"type": "default"}'::jsonb NOT NULL
);
CREATE TABLE cord.providers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    domains text[] DEFAULT '{}'::text[] NOT NULL,
    "iconURL" text NOT NULL,
    "nuxText" text,
    "mergeHashWithLocation" boolean DEFAULT false NOT NULL,
    "disableAnnotations" boolean DEFAULT false NOT NULL,
    "visibleInDiscoverToolsSection" boolean DEFAULT true NOT NULL,
    dirty boolean DEFAULT true NOT NULL,
    "claimingApplication" uuid
);
CREATE VIEW cord.providers_view AS
 WITH dm AS (
         SELECT provider_document_mutators."providerID",
            jsonb_agg(((row_to_json(provider_document_mutators.*))::jsonb - 'providerID'::text)) AS "documentMutators"
           FROM cord.provider_document_mutators
          GROUP BY provider_document_mutators."providerID"
        ), rules AS (
         SELECT provider_rules."providerID",
            jsonb_agg(((row_to_json(provider_rules.*))::jsonb - ARRAY['providerID'::text, 'order'::text]) ORDER BY provider_rules."order") AS rules
           FROM cord.provider_rules
          GROUP BY provider_rules."providerID"
        )
 SELECT p.id,
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
     LEFT JOIN dm ON ((p.id = dm."providerID")))
     LEFT JOIN rules ON ((p.id = rules."providerID")));
CREATE TABLE cord.published_providers (
    "providerID" uuid NOT NULL,
    "lastPublishedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ruleProvider" jsonb NOT NULL
);
CREATE TABLE cord.s3_buckets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    region text NOT NULL,
    name text NOT NULL,
    "accessKeyID" text NOT NULL,
    "accessKeySecret" text NOT NULL
);
CREATE TABLE cord.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "applicationID" uuid NOT NULL,
    "issuedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp with time zone
);
CREATE TABLE cord.slack_channels (
    "orgID" uuid NOT NULL,
    "slackID" text NOT NULL,
    name text NOT NULL,
    added boolean DEFAULT false NOT NULL,
    users integer DEFAULT 0 NOT NULL,
    archived boolean DEFAULT false NOT NULL
);
CREATE TABLE cord.slack_messages (
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "messageID" uuid NOT NULL,
    "sharerOrgID" uuid NOT NULL,
    "sharerUserID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "slackOrgID" uuid NOT NULL
);
CREATE TABLE cord.slack_mirrored_support_threads (
    "threadID" uuid NOT NULL,
    "threadOrgID" uuid NOT NULL,
    "slackOrgID" uuid NOT NULL,
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cord.slack_mirrored_threads (
    "threadID" uuid NOT NULL,
    "threadOrgID" uuid NOT NULL,
    "slackOrgID" uuid NOT NULL,
    "slackChannelID" text NOT NULL,
    "slackMessageTimestamp" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cord.task_assignees (
    "taskID" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignerID" uuid
);
CREATE TABLE cord.task_third_party_references (
    "taskID" uuid NOT NULL,
    "externalID" text NOT NULL,
    "externalConnectionType" cord.third_party_connection_type NOT NULL,
    "taskTodoID" uuid,
    "externalLocationID" text,
    "previewData" jsonb,
    imported boolean DEFAULT false NOT NULL
);
CREATE TABLE cord.task_third_party_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "externalConnectionType" cord.third_party_connection_type NOT NULL,
    "subscriptionDetails" jsonb NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE cord.task_todos (
    id uuid NOT NULL,
    "taskID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    done boolean NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE cord.tasks (
    id uuid NOT NULL,
    "messageID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    done boolean NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "doneStatusLastUpdatedBy" uuid
);
CREATE TABLE cord.third_party_connections (
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    type cord.third_party_connection_type NOT NULL,
    "externalID" text NOT NULL,
    "externalEmail" text NOT NULL,
    "externalAuthData" jsonb,
    "connectedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cord.thread_participants (
    "threadID" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastSeenTimestamp" timestamp with time zone,
    "lastUnseenMessageTimestamp" timestamp with time zone,
    subscribed boolean DEFAULT true NOT NULL,
    "lastUnseenReactionTimestamp" timestamp with time zone
);
CREATE TABLE cord.threads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    "orgID" uuid NOT NULL,
    "resolvedTimestamp" timestamp with time zone,
    "resolverUserID" uuid,
    url text NOT NULL,
    "supportStatus" cord.thread_support_status,
    "externalID" text NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pageContextHash" uuid NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "extraClassnames" text,
    CONSTRAINT threads_metadata_check CHECK ((NOT (metadata @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.user_hidden_annotations (
    "userID" uuid NOT NULL,
    "annotationID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "pageContextHash" uuid NOT NULL
);
CREATE TABLE cord.user_preferences (
    "userID" uuid NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL
);
CREATE TABLE cord.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "createdTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userType" cord.user_type DEFAULT 'person'::cord.user_type NOT NULL,
    admin boolean DEFAULT false NOT NULL,
    state cord.user_state DEFAULT 'active'::cord.user_state NOT NULL,
    name text,
    "nameUpdatedTimestamp" timestamp with time zone,
    "screenName" text,
    email text,
    "profilePictureURL" text,
    "profilePictureURLUpdatedTimestamp" timestamp with time zone,
    "externalID" text NOT NULL,
    "externalProvider" cord.profile_external_provider_type,
    "platformApplicationID" uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "updatedTimestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_check CHECK (((name IS NOT NULL) = ("nameUpdatedTimestamp" IS NOT NULL))),
    CONSTRAINT users_metadata_check CHECK ((NOT (metadata @? '$.*.type()?((@ != "string" && @ != "number") && @ != "boolean")'::jsonpath)))
);
CREATE TABLE cord.warm_demo_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "demoGroup" text NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    "userID" text NOT NULL,
    "orgID" text NOT NULL,
    version integer NOT NULL
);
INSERT INTO cord.applications VALUES
	('5a076ee9-8b9e-4156-9ac4-871bdc4569ec', 'Cord', 'cordrulez', '{"actions": "#FBCE37", "presence": "#FBCE37", "underlay": "#FAFAFA", "launcherOpen": "#FBCE37", "launcherClose": "#FBCE37"}', NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, NULL, NULL, NULL, '2022-09-29 10:01:34.854528+00', '12ed6251-28d5-4686-9a75-20a15bd31499', 'production', false, NULL, NULL),
	('b6501bf5-46f7-4db7-9996-c42dd9f758b0', 'Cord [SDK]', 'cordrulez', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, NULL, NULL, NULL, '2022-09-29 10:01:34.854528+00', '12ed6251-28d5-4686-9a75-20a15bd31499', 'production', false, NULL, NULL),
	('923ecd44-198f-49a2-a4f5-96f69c3d148b', 'cord-extension', 'cb3cbca83ef15736d8616f3b0d5ced5513f1e118eae4c39cdd0f9e01cd354ce7', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, NULL, NULL, NULL, '2024-01-17 10:46:14.557668+00', '12ed6251-28d5-4686-9a75-20a15bd31499', 'production', false, NULL, NULL);
INSERT INTO cord.customers VALUES
	('12ed6251-28d5-4686-9a75-20a15bd31499', 'Cord', '2022-09-29 10:01:34.854528+00', 'verified', false, false, 'proof_of_concept', NULL, NULL, 'd2cd3282c1e33551704a49f9dcae019526295a9f34b2fb612cd455cc2f9c3700', NULL, '{}', 'inactive', NULL, 'free', NULL),
	('1c367aca-37c9-4733-8bef-e9f11a7d0f17', 'Cord Sample Tokens', '2022-10-31 11:32:07+00', 'verified', false, false, 'proof_of_concept', NULL, NULL, 'e3d925a1b45f225620c187f8cd160d501cb9551911d393913bc78fa770a28b8f', NULL, '{}', 'inactive', NULL, 'free', NULL),
	('4383cf39-8b6a-4c33-9d8a-71567ed47a60', 'Cord Demo App Tokens', '2024-01-03 18:00:00+00', 'verified', false, false, 'proof_of_concept', NULL, NULL, 'ed863db7a652bfd6575ab769b1c3a8d90252bc5182f8c74a13e51b17301288d8', NULL, '{}', 'inactive', NULL, 'free', NULL);
INSERT INTO cord.org_members VALUES
	('d8009e91-03b8-4f17-9493-7855af13a5b2', 'edda098d-6db7-4202-a5ac-ff3293b78c47'),
	('f41627b5-d83a-4b71-8273-e2246623bf02', 'edda098d-6db7-4202-a5ac-ff3293b78c47');
INSERT INTO cord.orgs VALUES
	('746c0b57-7363-4766-9ee9-7ae8ec7531a8', 'Cord HQ', NULL, 'cord', 'platform', '2022-09-29 10:01:30.078857+00', 'active', NULL, NULL, '5a076ee9-8b9e-4156-9ac4-871bdc4569ec', false, '{}'),
	('edda098d-6db7-4202-a5ac-ff3293b78c47', 'Cord', NULL, 'cord', 'platform', '2022-09-29 10:01:34.197829+00', 'active', NULL, NULL, 'b6501bf5-46f7-4db7-9996-c42dd9f758b0', false, '{}');
INSERT INTO cord.provider_document_mutators VALUES
	('ae6554da-afae-416d-b1ed-2064cb96228b', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('87051a8e-934d-4192-b50c-c33450b3fea2', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'fixed_elements', NULL),
	('83d52072-0943-4c46-9c3b-895a6fe2a944', '4999a984-16a0-4c20-901c-a31aaf41ab2a', 'custom_css', '{"cssTemplate": "\\n        html {\\n          margin-right: {{width}}px !important;\\n        }\\n        #modalBackground {\\n          padding-right: {{width}}px !important;\\n        }\\n      "}'),
	('fd986859-3b0e-4791-b714-4d948de755ab', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('0cc6bc52-937f-4c3a-a250-d1f1416e705c', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'fixed_elements', NULL),
	('7ca6261a-57f3-4831-adf2-081648a706bb', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('97812c01-7be5-42b3-bdb1-6e3079b618ec', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'fixed_elements', NULL),
	('c4d66847-36e9-47b0-b9d9-c075186b4c8a', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'custom_css', '{"cssTemplate": ".lightbox-image-frame,\\n      .lightbox-status,\\n      .lightbox-comment-frame {\\n        right: {{width}}px !important;\\n      }\\n.device-desktop .phui-workboard-view-shadow {\\n        right: {{width}}px !important;\\n      }\\n.jx-client-dialog {\\n        right: {{width}}px !important;\\n        width: auto !important;\\n      }"}'),
	('2c360e4d-eb0d-43d4-8caf-16cc7d69f6e9', 'f15a72de-75e6-4595-af36-fb6ac748e6b8', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('4548497c-e1c4-4e71-9005-8bdd7587955d', 'f15a72de-75e6-4595-af36-fb6ac748e6b8', 'fixed_elements', NULL),
	('e6903183-525d-409c-8652-9b2e526575c0', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('3cb19940-1de3-4f49-9a77-69b08aa0aba4', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'fixed_elements', NULL),
	('72426f6f-487e-42f0-aa3a-d81a16a816b1', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'custom_css', '{"cssTemplate": ".bubble-element.FloatingGroup.floating-group > .bubble-r-line > .bubble-r-box >\\n        .bubble-element.CustomElement > .bubble-r-line > .bubble-r-box > .bubble-element.Group >\\n        .bubble-r-line >:last-child {\\n          margin-left: -{{width}}px !important;\\n       }\\n.main-page.bubble-element.Page > .bubble-r-line > .bubble-r-box > .bubble-element.Group {\\n         margin-left: calc(-{{width}}px / 2) !important;\\n       }\\n#drift-widget, .bubble-element.GroupFocus {\\n         transform: translateX(-{{width}}px) !important;\\n       }"}'),
	('a3fc2fc0-11cd-412f-8c0f-b8fc46fbffbc', 'b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('84db1058-4810-45bc-8a10-fa345177394d', 'b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'fixed_elements', NULL),
	('64e01986-6c9a-4180-a049-914fee5bc76a', '9102c8b1-b4a7-4dda-9db1-888e6266230f', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('47ca5a69-5b52-47d8-a1db-996e1c080901', '9102c8b1-b4a7-4dda-9db1-888e6266230f', 'fixed_elements', NULL),
	('54e28984-f2f0-4712-9b92-a86fe723dae6', '74987f27-86b4-4c18-8387-eed009535254', 'custom_css', '{"cssTemplate": "html, .ant-layout-header {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\n.ant-drawer-content-wrapper, .ant-modal-wrap {\\n        margin-right:{{width}}px !important;\\n      }\\n#root > div > section {\\n        width: 100% !important;\\n      }"}'),
	('db756c21-9459-4d22-9e29-58599e94ec1c', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('46acccde-b2d1-481c-a1e5-41caee1808d9', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'fixed_elements', NULL),
	('bf2c33ab-4a14-4d0f-87d9-0c5bff4167f8', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'custom_css', '{"cssTemplate": "\\n      .layout {\\n        width: calc(100% - {{width}}px) !important;\\n      }"}'),
	('55e004fb-ac70-49c8-b2ae-765ceec02daa', '3e275414-4e34-4672-9f30-cfa822300e7a', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('a1e6a200-e2d1-4167-bf60-4b59cdabad50', '3e275414-4e34-4672-9f30-cfa822300e7a', 'fixed_elements', NULL),
	('aec4a7ac-ffcd-4683-abc9-7e86683b9795', 'b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'custom_css', '{"cssTemplate": "body, .prerequisites-dialog, .user-preferences {\\n        margin-right: {{width}}px !important;\\n      }\\n#google-feedback-wizard {\\n        margin-left: -{{width}}px !important;\\n      }\\n.template-showcase-main.expanded {\\n        width: calc(100% - {{width}}px) !important;\\n      }"}'),
	('c9653951-759f-4af2-a8a0-4898ce56653e', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'custom_css', '{"cssTemplate": "\\n      .awsm-main {\\n        padding-right: {{width}}px !important;\\n      }\\n    "}'),
	('81fc7a11-adac-4088-8803-0d7f7e5a0cb3', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('b6b598f4-9abb-456d-9b43-923bd3a3c240', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'fixed_elements', NULL),
	('65c79fe2-0a4a-48d8-a215-4c189d4f6e3c', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('44218392-7247-4024-8cc6-ea0233c1debe', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'fixed_elements', NULL),
	('e70fb9d9-c33f-417d-a731-73b30d6bdbf0', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'custom_css', '{"cssTemplate": ".dashboard-detail-view,\\n      .workspace-layout,\\n      .workspace-region,\\n      #walkme-player,\\n      #walkme-menu {\\n        margin-right: {{width}}px !important;\\n      }"}'),
	('c82ea1f8-460c-469d-9bdb-d896d3e85b95', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'custom_css', '{"cssTemplate": "body,\\n.b-fixed-webflowlink.w-inline-block,\\n.modal.fade.ng-isolate-scope.in,\\n.w-webflow-badge,\\n#navbar_layout_control {\\n        margin-right: {{width}}px !important;\\n      }\\n.b-nav__wrap {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\n#right-sidebar {\\n        right: {{width}}px !important;\\n      }\\n.bem-TopBar_Body {\\n        width: calc(100% - 276px - {{width}}px) !important;\\n      }\\n.bem-Panel, .bem-Panel_Head {\\n        padding-right: {{width}}px !important;\\n      }"}'),
	('393aa2d8-170a-4d04-b6e9-79db33d3f884', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('6e77af0a-ec9d-4070-8ee3-840c5fa2d193', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'fixed_elements', NULL),
	('8ca635e8-5969-4d85-b7a7-bc5af97c5a65', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'custom_css', '{"cssTemplate": "html {\\n        padding-right:{{width}}px !important;\\n        position: relative !important;\\n      }\\n.presentation-header-options {\\n        margin-right: {{width}}px !important;\\n      }\\n.retool-help-modal {\\n        margin-right: {{width}}px !important;\\n      }\\n{{#if expanded}}\\n        #retool-help-dropdown {\\n          transform: translate(-140px, 0px)\\n        }\\n      {{/if}}\\n      "}'),
	('4b35b6a3-78f7-4ed7-965c-3d2872aa816c', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('0cb0ac30-2ea3-4c05-b802-555434861674', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'fixed_elements', NULL),
	('c9461a8a-271f-4ae9-babc-7e1dc873b2b8', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'custom_css', '{"cssTemplate": "html {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\n#uniqName_28_0 .background-color--underlay {\\n        margin-right: {{width}}px !important;\\n      }\\n.dialog-2bUis {\\n        margin-right: {{width}}px !important;\\n      }"}'),
	('b1aaa845-8175-42fd-bbbc-172a544c9c93', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'custom_css', '{"cssTemplate": "\\n        #topbar, #sitebar, #content-container {\\n          padding-right: {{width}}px;\\n        }\\n      \\n\\n        body.page-recording-share {\\n          width: calc(100% - {{width}}px);\\n        }\\n      "}'),
	('72888e2e-c716-4001-ad90-5f8dbfa7b972', 'fc48f4d2-509a-4323-b49b-6365492bd93a', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('dbddbbad-798c-4c21-b62d-5afd73deb41f', 'fc48f4d2-509a-4323-b49b-6365492bd93a', 'fixed_elements', NULL),
	('63a5a75f-0ea6-4c33-be5c-0ed2adb8d6c3', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('5d7eda85-3df0-478d-b8a8-55efd6dde1ce', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'fixed_elements', NULL),
	('50dab660-d0b6-4760-9677-2614f7b74b30', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'custom_css', '{"cssTemplate": ".home-common-dock-trial-suspended {\\n        margin-left: calc(-{{width}}px / 2) !important;\\n      }\\n#home-common-dock-1013 {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\n#home-common-dock-1013-targetEl >:last-child {\\n        left: auto !important;\\n        right: {{width}}px !important;\\n      }\\n#home-common-dock-1013-targetEl >:nth-last-child(2) {\\n        margin-left: -{{width}}px !important;\\n      }\\n#home-app-header-1039-targetEl >:last-child {\\n        margin-left: -{{width}}px !important;\\n      }\\ndiv[id^=\\"sleet-\\"] {\\n        width: calc(100% - {{width}}px) !important;\\n      }"}'),
	('7c59a69c-793d-4ecb-8e15-7db4de19d560', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'custom_css', '{"cssTemplate": "\\n      .slds-global-header_container, .mainContentMark {\\n        padding-right: {{width}}px;\\n      }\\n    "}'),
	('51ad929f-ced2-482f-905a-bdecd6cd2b6a', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'custom_css', '{"cssTemplate": "#h, #cc, #f {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\n#awsc-nav-header > div:first-child ._3oM2QEiiECt8LesXxKOnkJ {\\n        margin-right: {{width}}px !important;\\n        width: auto !important;\\n      }"}'),
	('6e66c743-8b7a-4815-87a1-a48d0a939c62', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('7e1f624e-07eb-48b0-b38c-278edbd81b6d', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'fixed_elements', NULL),
	('27473f35-71b1-4740-92fb-19717880a16b', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('9a612aca-e557-4d1e-b540-b76b9bab555a', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'fixed_elements', NULL),
	('b71d1d6d-fc4b-49de-adee-dfa254a90e96', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('d4dfd3cd-edec-457f-b000-accf94eac727', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'fixed_elements', NULL),
	('048af0d8-7822-4aae-9453-074e388475fa', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'custom_css', '{"cssTemplate": "body {\\n        margin-right: {{width}}px;\\n      }\\n#hubspot-messages-iframe-container {\\n        margin-right: {{width}}px;\\n      }"}'),
	('43011fe5-e264-4025-8216-7d90c8d64289', '91560f94-8d01-4370-a4ec-b50ce097295b', 'custom_css', '{"cssTemplate": ".LayoutFullPage,\\n       .app,\\n       .page,\\n       #navbar{\\n        padding-right: {{width}}px !important;\\n      }\\n@media screen and (min-width:1920px) {\\n        .LayoutFullPage.profile-3-column .profile-3-col-sidebar--center {\\n          min-width: calc(968px - {{width}}px) !important;\\n        }\\n      }\\n.navSearch-container {\\n        width: calc(100vw - {{width}}px) !important;\\n      }\\n.admin-app-container,\\n       .notification-sidebar-container,\\n       .private-overlay.uiOverlay-backdrop.private-modal-dialog--overlay,\\n       .private-panel.private-panel--right,\\n       #forms-application,\\n       #isc-help-widget,\\n       #help-widget {\\n        margin-right: {{width}}px !important;\\n      }\\n.private-close__button {\\n        transform: translateX(-{{width}}px) !important;\\n      }\\n.communicator--floating {\\n        margin-right: {{width}}px !important;\\n      }\\n.page .private-template__section--stretch, .page .private-template__section--header {\\n        margin-right: {{width}}px !important;\\n      }"}'),
	('1356579d-d17a-4830-a7c4-fa12b22a7e20', '26b741d2-67cd-4fa4-93ce-c7ce28402b54', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('62c305cc-3f35-47dd-8131-4e64a6d42f7e', '26b741d2-67cd-4fa4-93ce-c7ce28402b54', 'fixed_elements', NULL),
	('8c4a5422-ff24-48a7-a39a-f392502daf43', '5449b799-130c-462c-bec8-15cd68eab895', 'custom_css', '{"cssTemplate": "\\n    #root {\\n      padding-right: {{width}}px !important;\\n    }\\n\\n    div[data-reactroot].spread {\\n      right: {{width}}px !important;\\n    }\\n  "}'),
	('a3f1f82b-7cf8-45c1-9ab7-3cc503cd3125', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'custom_css', '{"cssTemplate": "\\n          {{#if expanded}}\\n            body > div[role=\\"presentation\\"] {\\n              margin: 0;\\n            }\\n\\n            body > div[role=\\"presentation\\"] > div.MuiPaper-root.MuiPaper-elevation1 {\\n              transform-origin: center left;\\n              transform: scale(0.8);\\n            }\\n\\n            #root header {\\n              padding-right: {{width}}px;\\n            }\\n          {{else}}\\n            #root header {\\n              padding-right: {{width}}px;\\n            }\\n          {{/if}}\\n          "}'),
	('03ea5cb6-8983-454f-99ef-50d0c8bba0d9', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'custom_css', '{"cssTemplate": "body .global-nav {\\n          padding-right: calc(\\n            {{width}}px + 30px\\n          ) !important;\\n        }\\nbody .side-panel__modal,body .msg-overlay-container {\\n          right: {{width}}px !important;\\n        }\\nbody .application-outlet {\\n          padding-right: {{width}}px !important;\\n        }\\n\\n        body > div.flex-fill > * {\\n          margin-right: {{width}}px !important;\\n        }\\n\\n        body > .global-footer__content {\\n          margin-right: {{width}}px !important;\\n        }\\n      "}'),
	('478ca96b-882a-4acc-aafc-d04c0ac89c02', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('c0b05830-67ca-448d-af8b-5271a7e5cec5', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'fixed_elements', NULL),
	('c8865d93-9b38-4a7a-a9f1-388e5270d07b', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('b45a852f-2153-4a33-95cb-8b6ceea1ee94', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'fixed_elements', NULL),
	('6be77693-4dc9-4197-984f-81a867ae90f8', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'custom_css', '{"cssTemplate": ".clsDesktop{\\n        right: {{width}}px !important;\\n      }"}'),
	('dc420152-d942-45e3-b840-5a4892b11d28', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'custom_css', '{"cssTemplate": "body, #tab-dashboard-region, #walkme-menu {\\n      margin-right: {{width}}px !important;\\n    }\\n#walkme-player {\\n      right: {{width}}px !important;\\n    }"}'),
	('bcd9b810-db2c-4c03-9e31-101f6c84c97e', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('a02ea8a3-6a9e-4ddf-92a4-60c6edbc3471', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'fixed_elements', NULL),
	('f0ea16bd-ea90-4fe3-9f9f-3a01641ddc97', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('a63dcfdd-cbba-4a13-96ab-bb242b0b500f', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'fixed_elements', NULL),
	('9c52ea43-244a-483a-bbbb-ee6f5f747b67', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'custom_css', '{"cssTemplate": "#root > div[class^=''BaseStylesRoot''] {\\n        width: 100% !important;\\n      }\\ndiv[class^=''app__Content-sc''] {\\n        min-width: 100% !important;\\n      }\\ndiv[class*=''DialogRoot''], div[class*=''PopupCardContainer''] {\\n        width: calc(100% - {{width}}px) !important;\\n      }\\ndiv[class*=\\"form-header__HeaderWrapper\\"] {\\n        min-width: 100% !important;\\n      }\\ndiv[class*=''form-preview__Wrapper''] {\\n        width: calc(100% - {{width}}px) !important;\\n      }"}'),
	('e76ccad8-b3bd-42da-b772-31d62d9f8e4d', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('7a7f047b-a8c9-48fe-9448-df8ef82eaa6d', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'fixed_elements', NULL),
	('235453d6-be28-4970-b7f6-8434955f5b65', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('fe0cbca1-b7fa-4548-99d0-c2f716345750', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'fixed_elements', NULL),
	('809f4725-5b37-4a5b-805a-ed90732edda5', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('2f958dda-8985-4689-b5ae-99989594cfde', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'fixed_elements', NULL),
	('066f6bc1-1875-453f-916a-658008037af9', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('484c9dbb-94ae-44d2-ac1f-77cc598d3e7f', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'fixed_elements', NULL),
	('27100e01-0865-47d1-a068-13fbe33ba6ff', 'd19d7a6f-8fce-453a-8619-90d9c6d8c199', 'custom_css', '{"cssTemplate": "embed {\\n      width: calc(100% - {{width}}px) !important;\\n    }"}'),
	('e8483be5-1538-4a7c-9f91-f647198ae0b1', 'e54ae87a-741e-4f45-a5c0-6e28647b3d90', 'custom_css', '{"cssTemplate": "embed {\\n      width: calc(100% - {{width}}px) !important;\\n    }"}'),
	('b720f33f-8e06-4a2f-9205-dc80f8270ebd', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'custom_css', '{"cssTemplate": "\\n      html {\\n        margin-right: {{width}}px !important;\\n      }\\n      #modalBackground {\\n        padding-right: {{width}}px !important;\\n      }"}'),
	('2f1208dc-96c9-4bcb-aeda-bb89691ef23d', 'b6a43b55-4ff5-4ffc-b506-676291747ce2', 'default_css', '{"cssTemplate": "html { margin-right: {{width}}px !important; }"}'),
	('5962a915-ba68-4f43-ba3b-908ecf1b5b69', 'b6a43b55-4ff5-4ffc-b506-676291747ce2', 'fixed_elements', NULL);
INSERT INTO cord.provider_rule_tests VALUES
	('b08da99d-b34e-4852-90fc-7f37083e5578', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/admin/main.php?action=personalization#form-0', NULL, 'allow', '{"page": "form-0", "action": "personalization", "project": "cord", "section": "admin"}', 'action: personalization, page: form-0, project: cord, section: admin'),
	('cddac62a-a48e-4fc1-8d7d-a17d375b5103', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/app/contacts/?listid=1&status=1', NULL, 'allow', '{"listid": "1", "project": "cord", "section": "app", "subsection": "contacts"}', 'listid: 1, project: cord, section: app, subsection: contacts'),
	('12fe3d00-2847-4c99-b8d5-132db31d9cb1', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/admin/main.php?action=list', NULL, 'allow', '{"action": "list", "project": "cord", "section": "admin"}', 'action: list, project: cord, section: admin'),
	('c54ef1f6-8931-4c10-961d-c3ea16cf8057', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/app/contacts/?seriesid=1', NULL, 'allow', '{"project": "cord", "section": "app", "seriesid": "1", "subsection": "contacts"}', 'project: cord, section: app, seriesid: 1, subsection: contacts'),
	('cb201dc8-8d58-4cdf-8463-362c387eadac', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/series/1', NULL, 'allow', '{"id": "1", "project": "cord", "section": "series"}', 'id: 1, project: cord, section: series'),
	('5167a1ee-2a5b-43e1-b530-acea9debec04', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/admin/main.php?action=campaign_new_summary&id=1', NULL, 'allow', '{"id": "1", "action": "campaign_new_summary", "project": "cord", "section": "admin"}', 'action: campaign_new_summary, id: 1, project: cord, section: admin'),
	('b375a9e4-e51b-4743-8f74-c8987f04e266', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'https://cord.activehosted.com/campaign/1/designer', NULL, 'allow', '{"id": "1", "project": "cord", "section": "campaign", "subsection": "designer"}', 'id: 1, project: cord, section: campaign, subsection: designer'),
	('d271af06-6a8a-4b40-b38f-e626e89d3950', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/express/dashboard?campaignId=10567663831&ocid=529504738&euid=422949967&__u=8278456983&uscid=529504738&__c=4250612562&authuser=0', NULL, 'allow', '{"section": "dashboard", "campaignId": "10567663831"}', 'campaignId: 10567663831, section: dashboard'),
	('76dadb4e-7db4-4d7f-987f-b539786c40dc', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/express/dashboard?campaignId=10567663831&ocid=529504738&euid=422949967&__u=8278456983&edit=ads&uscid=529504738&__c=4250612562&authuser=0', NULL, 'allow', '{"edit": "ads", "section": "dashboard", "campaignId": "10567663831"}', 'campaignId: 10567663831, edit: ads, section: dashboard'),
	('26229904-71ea-429c-a2e6-98e8f2399c12', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/adgroups?campaignId=10573046554&ocid=529504738&euid=422949967&__u=8278456983&uscid=529504738&__c=4250612562&authuser=0', NULL, 'allow', '{"section": "adgroups", "campaignId": "10573046554"}', 'campaignId: 10573046554, section: adgroups'),
	('e83302ef-bdaf-4ea4-ac4b-0345a0fcd613', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/landingpages/expanded?campaignId=10573046554&adGroupId=101725473582&ocid=529504738&euid=422949967&__u=8278456983&uscid=529504738&__c=4250612562&authuser=0', NULL, 'allow', '{"section": "landingpages", "adGroupId": "101725473582", "campaignId": "10573046554", "subsection": "expanded"}', 'adGroupId: 101725473582, campaignId: 10573046554, section: landingpages, subsection: expanded'),
	('c17b0710-0d62-443f-9428-da9785841495', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/keywords?campaignId=10573046554&adGroupId=101725473582&ocid=529504738&euid=422949967&__u=8278456983&uscid=529504738&__c=4250612562&authuser=0', NULL, 'allow', '{"section": "keywords", "adGroupId": "101725473582", "campaignId": "10573046554"}', 'adGroupId: 101725473582, campaignId: 10573046554, section: keywords'),
	('9624af7c-05f9-4bc9-af25-eee7b1b3be14', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'https://ads.google.com/aw/campaigns?ocid=273392631&euid=392931977&__u=8926233473&uscid=117885291&__c=9640367059&authuser=0', NULL, 'allow', '{"section": "campaigns"}', 'section: campaigns'),
	('334979a1-feba-47d9-8fd8-a62612df3046', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/new/campaign/setup?&modal=create_campaign', NULL, 'allow', '{"action": "new", "product": "campaign", "section": "setup", "accountId": "18ce54x6ggh", "objectType": "campaign"}', 'accountId: 18ce54x6ggh, action: new, objectType: campaign, product: campaign, section: setup'),
	('e02c8d21-75eb-43dd-87ea-fd20d94fb0f7', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/new/campaign/setup?objective=11', NULL, 'allow', '{"action": "new", "product": "campaign", "section": "setup", "accountId": "18ce54x6ggh", "objective": "11", "objectType": "campaign"}', 'accountId: 18ce54x6ggh, action: new, objectType: campaign, objective: 11, product: campaign, section: setup'),
	('06ba2bfc-abf1-4aeb-b9b5-14406aa08c90', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/new/adgroup/0/details?objective=11', NULL, 'allow', '{"action": "new", "product": "campaign", "section": "details", "objectId": "0", "accountId": "18ce54x6ggh", "objective": "11", "objectType": "adgroup"}', 'accountId: 18ce54x6ggh, action: new, objectId: 0, objectType: adgroup, objective: 11, product: campaign, section: details'),
	('105c775f-c790-4b54-ba04-7888549a5f52', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/ads_manager/18ce54x6ggh/campaigns/?endDate=2020-11-11&startDate=2020-11-05', NULL, 'allow', '{"page": "campaigns", "product": "ads_manager", "accountId": "18ce54x6ggh"}', 'accountId: 18ce54x6ggh, page: campaigns, product: ads_manager'),
	('c73d4474-b4b5-401f-b17b-e8b973aab851', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/ads_manager/18ce54x6ggh/campaigns/?editId=24746019&editSectionKey=campaign&endDate=2020-11-11&startDate=2020-11-05', NULL, 'allow', '{"page": "campaigns", "editId": "24746019", "product": "ads_manager", "accountId": "18ce54x6ggh"}', 'accountId: 18ce54x6ggh, editId: 24746019, page: campaigns, product: ads_manager'),
	('10c14ddf-e13b-4e30-8dba-59aa828b3127', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/edit/campaign/setup?editId=24746019&refPath=%2Fads_manager%2F18ce54x6ggh%2Fcampaigns%2F%3FendDate%3D2020-11-11%26startDate%3D2020-11-05', NULL, 'allow', '{"action": "edit", "editId": "24746019", "product": "campaign", "section": "setup", "accountId": "18ce54x6ggh", "objectType": "campaign"}', 'accountId: 18ce54x6ggh, action: edit, editId: 24746019, objectType: campaign, product: campaign, section: setup'),
	('8164e3cc-2495-4dde-8d0c-cf303998718e', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/edit/adgroup/30691384/demographics?editId=24746019&refPath=%2Fads_manager%2F18ce54x6ggh%2Fcampaigns%2F%3FendDate%3D2020-11-11%26startDate%3D2020-11-05', NULL, 'allow', '{"action": "edit", "editId": "24746019", "product": "campaign", "section": "demographics", "objectId": "30691384", "accountId": "18ce54x6ggh", "objectType": "adgroup"}', 'accountId: 18ce54x6ggh, action: edit, editId: 24746019, objectId: 30691384, objectType: adgroup, product: campaign, section: demographics'),
	('9e1279e3-f95b-4a62-99be-8b7ec88c48f0', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/edit/adgroup/30691384/targeting_features?editId=24746019&refPath=%2Fads_manager%2F18ce54x6ggh%2Fcampaigns%2F%3FendDate%3D2020-11-11%26startDate%3D2020-11-05', NULL, 'allow', '{"action": "edit", "editId": "24746019", "product": "campaign", "section": "targeting_features", "objectId": "30691384", "accountId": "18ce54x6ggh", "objectType": "adgroup"}', 'accountId: 18ce54x6ggh, action: edit, editId: 24746019, objectId: 30691384, objectType: adgroup, product: campaign, section: targeting_features'),
	('bc93d518-3be7-4478-a916-d5240a3e1fc6', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/campaign/18ce54x6ggh/edit/review/review?editId=24746019&refPath=%2Fads_manager%2F18ce54x6ggh%2Fcampaigns%2F%3FendDate%3D2020-11-11%26startDate%3D2020-11-05', NULL, 'allow', '{"action": "edit", "editId": "24746019", "product": "campaign", "section": "review", "accountId": "18ce54x6ggh", "objectType": "review"}', 'accountId: 18ce54x6ggh, action: edit, editId: 24746019, objectType: review, product: campaign, section: review'),
	('a0a2ac8d-1f37-4843-8c2b-1d902ad4b658', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/accounts/18ce54x6ggh/power_tools/editor', NULL, 'allow', '{"product": "accounts", "section": "power_tools", "accountId": "18ce54x6ggh", "subsection": "editor"}', 'accountId: 18ce54x6ggh, product: accounts, section: power_tools, subsection: editor'),
	('cabe94b0-431b-4886-8cf8-870fd1367614', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/audiences/18ce54x6ggh/audience_manager', NULL, 'allow', '{"product": "audiences", "section": "audience_manager", "accountId": "18ce54x6ggh"}', 'accountId: 18ce54x6ggh, product: audiences, section: audience_manager'),
	('25e51880-d13a-4857-8dfd-56b47f78ea4b', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/accounts/18ce54x6ggh/media', NULL, 'allow', '{"product": "accounts", "section": "media", "accountId": "18ce54x6ggh"}', 'accountId: 18ce54x6ggh, product: accounts, section: media'),
	('006cd11c-0bcb-47f4-ad9a-6ce4e513c70b', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/tweets_manager/18ce54x6ggh/tweets/85273149/DRAFT', NULL, 'allow', '{"product": "tweets_manager", "section": "tweets", "accountId": "18ce54x6ggh", "subsection": "85273149"}', 'accountId: 18ce54x6ggh, product: tweets_manager, section: tweets, subsection: 85273149'),
	('756a4332-94f1-4f8a-b09a-cb6d413a5a34', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'https://ads.twitter.com/composer/18ce54x6ggh/carousel?tweet_id=132665&tweet_type=DRAFT&action_type=EDIT', NULL, 'allow', '{"product": "composer", "section": "carousel", "tweetId": "132665", "accountId": "18ce54x6ggh"}', 'accountId: 18ce54x6ggh, product: composer, section: carousel, tweetId: 132665'),
	('8ca7c66e-f492-4268-b63a-3822c14a33de', '3e275414-4e34-4672-9f30-cfa822300e7a', 'https://analytics.google.com/analytics/web/#/report-home/a15520', NULL, 'allow', '{"reportId": "a15520"}', 'reportId: a15520'),
	('98c0049a-814e-4a34-964b-96408c3e6f0a', '3e275414-4e34-4672-9f30-cfa822300e7a', 'https://analytics.google.com/analytics/web/#/realtime/rt-overview/a15520/', NULL, 'allow', '{"section": "realtime", "reportId": "a15520", "subsection": "rt-overview"}', 'reportId: a15520, section: realtime, subsection: rt-overview'),
	('40a453af-1116-48ba-9db1-587e06de4bce', '3e275414-4e34-4672-9f30-cfa822300e7a', 'https://analytics.google.com/analytics/web/?authuser=1#/report/content-site-search-overview/a1269180/_u.date00=20200705&_u.date01=20200707', NULL, 'allow', '{"section": "report", "reportId": "a1269180", "subsection": "content-site-search-overview"}', 'reportId: a1269180, section: report, subsection: content-site-search-overview'),
	('7912ed54-b3b1-46b8-a82e-3ae43753209a', '4999a984-16a0-4c20-901c-a31aaf41ab2a', 'https://app.cord.com/', NULL, 'deny', NULL, NULL),
	('8c41a064-20e3-44ac-9cfd-d269cdd170bb', '4999a984-16a0-4c20-901c-a31aaf41ab2a', 'https://app.cord.com/#features', NULL, 'deny', NULL, NULL),
	('22db850e-739d-451d-9633-f2f234b682c2', '4999a984-16a0-4c20-901c-a31aaf41ab2a', 'https://app.cord.com/company/', NULL, 'allow', '{"workspace": "company"}', 'workspace: company'),
	('6da7ebb4-362c-4575-b082-0866113c2081', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/dashboard', NULL, 'allow', '{"section": "dashboard"}', 'section: dashboard'),
	('5edfc338-a875-47b9-96a0-b88a221de50f', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/analytics/audience/overview', NULL, 'allow', '{"section": "audience", "subsection": "overview"}', 'section: audience, subsection: overview'),
	('032180f4-39d1-4180-b009-055cf335d071', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/analytics/audience/funnel/0/', NULL, 'allow', '{"item": "0", "section": "audience", "subsection": "funnel"}', 'item: 0, section: audience, subsection: funnel'),
	('c46dd7e6-9f33-40c8-86f0-b33b87ca01e0', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/analytics/engagements/email/performance', NULL, 'allow', '{"item": "performance", "section": "engagements", "subsection": "email"}', 'item: performance, section: engagements, subsection: email'),
	('1e99ab90-c372-4686-b2b2-14a9ea7afb5a', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/analytics/features/performance/4b-b38b-4feb-2b', NULL, 'allow', '{"item": "4b-b38b-4feb-2b", "section": "features", "subsection": "performance"}', 'item: 4b-b38b-4feb-2b, section: features, subsection: performance'),
	('cd7764a7-418c-4909-83b1-712b1ba6d8df', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/engagement/6eb38135-9b6b--b6d5-60', NULL, 'allow', '{"section": "engagement", "objectId": "6eb38135-9b6b--b6d5-60"}', 'objectId: 6eb38135-9b6b--b6d5-60, section: engagement'),
	('2c481987-f22d-4cdc-bd0f-e13d937ffaa6', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'https://app.aptrinsic.com/knowledge-center/ecfdd-bf4c-9563-4b?new=1', NULL, 'allow', '{"section": "knowledge-center", "objectId": "ecfdd-bf4c-9563-4b"}', 'objectId: ecfdd-bf4c-9563-4b, section: knowledge-center'),
	('668d48c6-c59a-4224-9e3c-5ce0a83ef61a', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/software/projects/STLR/boards/1', NULL, 'allow', '{"board": "1", "space": "radicalhq", "product": "jira", "project": "STLR", "section": "boards"}', 'board: 1, product: jira, project: STLR, section: boards, space: radicalhq'),
	('1f6d9051-c3fe-4820-889c-ca390ed5fc2e', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/software/projects/STLR/boards/1?selectedIssue=STLR-1', NULL, 'allow', '{"issue": "STLR-1", "space": "radicalhq", "product": "jira", "section": "issues"}', 'issue: STLR-1, product: jira, section: issues, space: radicalhq'),
	('25480f62-64bd-42b9-860f-c31c94c09669', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/browse/STLR-1?atlOrigin=eyJp', NULL, 'allow', '{"issue": "STLR-1", "space": "radicalhq", "product": "jira", "section": "issues"}', 'issue: STLR-1, product: jira, section: issues, space: radicalhq'),
	('f7571dda-05bb-4ed8-9336-2e10e3389510', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/software/projects/STLR/boards/1/roadmap', NULL, 'allow', '{"board": "1", "space": "radicalhq", "product": "jira", "project": "STLR", "section": "boards", "subsection": "roadmap"}', 'board: 1, product: jira, project: STLR, section: boards, space: radicalhq, subsection: roadmap'),
	('572666f7-3094-49a8-aa2f-ea6605929705', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/software/projects/STLR/code', NULL, 'allow', '{"space": "radicalhq", "product": "jira", "project": "STLR", "section": "code"}', 'product: jira, project: STLR, section: code, space: radicalhq'),
	('d559e294-b754-49b4-a6b9-1cb310701585', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/wiki/spaces/STELLAR/pages/edit-v2/23592962?draftShareId=ea18-d0', NULL, 'allow', '{"space": "radicalhq", "pageId": "23592962", "draftId": "ea18-d0", "product": "wiki", "project": "STELLAR", "section": "pages", "subsection": "edit"}', 'draftId: ea18-d0, pageId: 23592962, product: wiki, project: STELLAR, section: pages, space: radicalhq, subsection: edit'),
	('beefe7d0-72bf-4343-8f28-a5ce4640244d', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/wiki/spaces/STELLAR/overview', NULL, 'allow', '{"space": "radicalhq", "product": "wiki", "project": "STELLAR", "section": "overview"}', 'product: wiki, project: STELLAR, section: overview, space: radicalhq'),
	('4cbbcdc3-cf8b-4f7c-8ce2-87392259cd5e', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/wiki/spaces/STELLAR/pages/23592976/Test+Page', NULL, 'allow', '{"space": "radicalhq", "pageId": "23592976", "product": "wiki", "project": "STELLAR", "section": "pages"}', 'pageId: 23592976, product: wiki, project: STELLAR, section: pages, space: radicalhq'),
	('0398b4ee-7d83-47d9-a2c2-4f4d7874b087', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/software/projects/STLR/pages', NULL, 'allow', '{"space": "radicalhq", "product": "jira", "project": "STLR", "section": "pages"}', 'product: jira, project: STLR, section: pages, space: radicalhq'),
	('48ff8621-d3c8-4c00-873d-800b04c25455', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/secure/Dashboard.jspa?selectPageId=10000', NULL, 'allow', '{"space": "radicalhq", "product": "secure", "section": "Dashboard", "dashboard": "10000"}', 'dashboard: 10000, product: secure, section: Dashboard, space: radicalhq'),
	('bcd68f50-6fab-4f34-bd8b-b35f47254ac5', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/jira/people/team/6b2e-43?ref=jira&src=peopleMenu', NULL, 'allow', '{"space": "radicalhq", "teamId": "6b2e-43", "product": "jira", "project": "team"}', 'product: jira, project: team, space: radicalhq, teamId: 6b2e-43'),
	('a5ffcd5a-cab8-40f8-99ad-9bde352dbd02', '74987f27-86b4-4c18-8387-eed009535254', 'https://secure.internal.io/spaces/monthly-kp-is', NULL, 'allow', '{"section": "spaces", "subsection": "monthly-kp-is"}', 'section: spaces, subsection: monthly-kp-is'),
	('62a3635a-29da-4637-8a43-47dc64623346', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/issues/?filter=10001', NULL, 'allow', '{"space": "radicalhq", "product": "issues", "filterId": "10001"}', 'filterId: 10001, product: issues, space: radicalhq'),
	('e60fe28e-e75f-491c-a834-d98a61785a72', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/browse/STLR-2?filter=10001', NULL, 'allow', '{"issue": "STLR-2", "space": "radicalhq", "product": "jira", "section": "issues"}', 'issue: STLR-2, product: jira, section: issues, space: radicalhq'),
	('8dfc2b04-6520-40b7-9b20-15e5a38c00f9', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'https://radicalhq.atlassian.net/secure/ManageFilters.jspa', NULL, 'allow', '{"space": "radicalhq", "product": "secure", "section": "ManageFilters"}', 'product: secure, section: ManageFilters, space: radicalhq'),
	('21d8a808-c8ec-4842-88d3-40180b8d2408', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#Home:', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "Home"}', 'page: home, product: ec2, section: Home'),
	('622712ae-6dda-4e2e-b805-afbe6fce4360', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#Instances:', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "Instances"}', 'page: home, product: ec2, section: Instances'),
	('c7e04b2f-dc73-4b19-9402-13a0b93fb2c9', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#InstanceDetails:instanceId=i-0b4882b4ed6c11acb', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "InstanceDetails"}', 'page: home, product: ec2, section: InstanceDetails'),
	('825af362-d08c-4a00-ab76-2033c98aa2e4', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#Volumes:volumeId=vol-0007afa06fa2bc548;sort=desc:createTime', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "Volumes"}', 'page: home, product: ec2, section: Volumes'),
	('296d8b98-d03f-45c0-a62f-7e40fa7647d9', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#SecurityGroup:securityGroupId=sg-032d', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "SecurityGroup", "resourceId": "sg-032d"}', 'page: home, product: ec2, resourceId: sg-032d, section: SecurityGroup'),
	('f0da2ff0-9574-4191-9d8d-2af29f41c89c', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#manage-tags:resource-type=instances;key=Name;value=build', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "manage-tags"}', 'page: home, product: ec2, section: manage-tags'),
	('dbcd4a9b-6056-4acf-ae2a-5635698b3796', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#InstanceTypeDetails:instanceType=t2.micro', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "InstanceTypeDetails", "resourceId": "t2.micro"}', 'page: home, product: ec2, resourceId: t2.micro, section: InstanceTypeDetails'),
	('f4c9d99a-16f8-4f47-a450-b451a57242a6', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2sp/v2/home?region=eu-west-2#/spot/launch', NULL, 'allow', '{"page": "home", "product": "ec2sp", "section": "spot", "subsection": "launch"}', 'page: home, product: ec2sp, section: spot, subsection: launch'),
	('4d732561-e1a2-4a69-bfc7-5bbb3a5ee703', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#ElasticIpDetails:AllocationId=eipalloc-06851f', NULL, 'allow', '{"page": "home", "product": "ec2", "section": "ElasticIpDetails", "resourceId": "eipalloc-06851f"}', 'page: home, product: ec2, resourceId: eipalloc-06851f, section: ElasticIpDetails'),
	('c593fb6c-c7bb-48d2-9423-fc76e7cc56d9', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'https://console.aws.amazon.com/route53resolver/home?region=us-east-1#/rules', NULL, 'allow', '{"page": "home", "product": "route53resolver", "section": "rules"}', 'page: home, product: route53resolver, section: rules'),
	('199f8552-3533-4ab2-87df-1e820a4b47ca', '5449b799-130c-462c-bec8-15cd68eab895', 'https://bi.prod.netpurpose.com/', '<html><body/></html>', 'deny', NULL, NULL),
	('c74e86fe-9bfc-494f-b10a-9c2c490db904', '5449b799-130c-462c-bec8-15cd68eab895', 'https://bi.prod.netpurpose.com/question#eyJkYXRhc2V0X3F1ZXJ5Ijp7InF1ZXJ5Ijp7InNvdXJjZS10YWJsZSI6MywiZmlsdGVyIjpbImFuZCIsWyI9IixbImZpZWxkLWlkIiwzMF0sIjEiXV19LCJ0eXBlIjoicXVlcnkiLCJkYXRhYmFzZSI6MX0sImRpc3BsYXkiOiJ0YWJsZSIsInZpc3VhbGl6YXRpb25fc2V0dGluZ3MiOnt9fQ==', '<html><body/></html>', 'allow', '{"display": "table", "dataset_query": {"type": "query", "query": {"filter": ["and", ["=", ["field-id", "30"], "1"]], "source-table": "3"}, "database": "1"}, "visualization_settings": {}}', 'Metabase'),
	('779cd6a4-1bdd-4e79-8bff-390b39a44af0', '5449b799-130c-462c-bec8-15cd68eab895', 'https://bi.prod.netpurpose.com/question#e30=', '<html><body><div><h1>FooBar</h1><span>type</span></div></body></html>', 'allow', '{}', 'type FooBar'),
	('184d9ee5-34d8-4d4f-aa52-e8f65abe7a8f', '5449b799-130c-462c-bec8-15cd68eab895', 'https://bi.prod.netpurpose.com/question#e30=', '<html><body><div><h2>FooBar</h2><span>type</span></div></body></html>', 'allow', '{}', 'FooBar'),
	('0efed43e-43fb-4ee5-9f5f-39ffc63eaa31', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'https://bubble.io/page?version=live&name=index&id=radicaltester&tab=tabs-3&subtab=Data%20Types', NULL, 'allow', '{"id": "radicaltester", "tab": "tabs-3", "name": "index", "subtab": "Data Types", "section": "page", "version": "live"}', 'id: radicaltester, name: index, section: page, subtab: Data Types, tab: tabs-3, version: live'),
	('3f3b0c10-2c41-4286-88d2-9bbd2f505c83', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'http://radicaltester.bubbleapps.io/index?debug_mode=true', NULL, 'allow', '{"id": "radicaltester", "name": "index"}', 'id: radicaltester, name: index'),
	('740be0dc-bfe9-453f-ab96-68dee8e367bc', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'https://bubble.io/page?name=index&id=radicaltester&tab=tabs-1', NULL, 'allow', '{"id": "radicaltester", "tab": "tabs-1", "name": "index", "section": "page"}', 'id: radicaltester, name: index, section: page, tab: tabs-1'),
	('096c5522-ead6-4ba8-a7a1-686f7cae8ab2', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'https://bubble.io/page?version=live&name=index&id=radicaltester&tab=tabs-1', NULL, 'allow', '{"id": "radicaltester", "tab": "tabs-1", "name": "index", "section": "page", "version": "live"}', 'id: radicaltester, name: index, section: page, tab: tabs-1, version: live'),
	('541a70d9-c042-4775-a4b2-89fa1148ced5', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/', NULL, 'allow', '{"account": "getradical"}', 'account: getradical'),
	('bad33e85-5598-477d-88d9-f06e37b131f9', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/sandbox-npgetradicalco-radical-main/chart/8902403/?next=%2Fgetradical%2Fsandbox-npgetradicalco-radical-main%2Fchart-8902403', NULL, 'allow', '{"itemId": "8902403", "account": "getradical", "section": "chart", "dashboard": "sandbox-npgetradicalco-radical-main"}', 'account: getradical, dashboard: sandbox-npgetradicalco-radical-main, itemId: 8902403, section: chart'),
	('e8fa5318-b640-47ee-9d9a-4f68370b0769', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/document-company-demo-data/log/?page=1&count=25&sortBy=0&sortDescending=true', NULL, 'allow', '{"account": "getradical", "section": "datasources", "dashboard": "document-company-demo-data", "subsection": "log"}', 'account: getradical, dashboard: document-company-demo-data, section: datasources, subsection: log'),
	('3290f0a1-bbea-4ab1-a7d9-c5a8d7368104', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/document-company-demo-data/schema/?schema_id=176553', NULL, 'allow', '{"account": "getradical", "section": "datasources", "schemaId": "176553", "dashboard": "document-company-demo-data", "subsection": "schema"}', 'account: getradical, dashboard: document-company-demo-data, schemaId: 176553, section: datasources, subsection: schema'),
	('c436f364-6335-44c8-b698-96139102bd8f', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/document-company-demo-data/schema/', NULL, 'allow', '{"account": "getradical", "section": "datasources", "dashboard": "document-company-demo-data", "subsection": "schema"}', 'account: getradical, dashboard: document-company-demo-data, section: datasources, subsection: schema'),
	('4eff7551-5d0d-4a83-937c-77685f06e2f4', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.tryretool.com/', NULL, 'allow', '{"workspace": "radicalhq"}', 'workspace: radicalhq'),
	('5b609e82-c586-426d-9233-ef79035abbe6', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/document-company-demo-data/connection/', NULL, 'allow', '{"account": "getradical", "section": "datasources", "dashboard": "document-company-demo-data", "subsection": "connection"}', 'account: getradical, dashboard: document-company-demo-data, section: datasources, subsection: connection'),
	('3dd9b162-142a-45c3-93a6-11d6769242a5', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/alerts/3617', NULL, 'allow', '{"itemId": "3617", "account": "getradical", "section": "alerts"}', 'account: getradical, itemId: 3617, section: alerts'),
	('16b63472-b11a-494e-98cf-5d7adb4aee19', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/alerts/', NULL, 'allow', '{"account": "getradical", "section": "alerts"}', 'account: getradical, section: alerts'),
	('a3af4cf1-237e-4c5f-afe4-bef2c988bc6f', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/radical_db/', NULL, 'allow', '{"account": "getradical", "section": "datasources", "dashboard": "radical_db"}', 'account: getradical, dashboard: radical_db, section: datasources'),
	('050bd297-ff93-4d0e-92f7-8022367cce38', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/settings/datasources/', NULL, 'allow', '{"account": "getradical", "section": "datasources"}', 'account: getradical, section: datasources'),
	('3725bedc-2940-4a6c-bfa4-9ca7e76023c7', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/explore/', NULL, 'allow', '{"account": "getradical", "section": "explore"}', 'account: getradical, section: explore'),
	('2b3a1a1d-a39e-4d48-b27e-c86c4987330b', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/getradical/sandbox-npgetradicalco-radical-main/', NULL, 'allow', '{"account": "getradical", "section": "sandbox-npgetradicalco-radical-main"}', 'account: getradical, section: sandbox-npgetradicalco-radical-main'),
	('aa17d2df-95b5-4907-a7d4-c95abe97e2bf', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://www.chartio.com/', NULL, 'deny', NULL, NULL),
	('341587b0-5bdb-4e5a-99c8-d0606f26abaa', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/login', NULL, 'deny', NULL, NULL),
	('256cce00-3b2b-4c90-a587-e1efeacacb4c', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'https://chartio.com/', NULL, 'deny', NULL, NULL),
	('adfb01e0-af65-48f7-b568-9126d275a43b', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery?authuser=1&project=uptrek-221322&folder=&supportedpurview=project', NULL, 'allow', '{"project": "uptrek-221322", "section": "bigquery"}', 'project: uptrek-221322, section: bigquery'),
	('51c24eeb-9f42-4cd7-b7ca-9272ed1516d8', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery?project=metabase-getradical&j=bq:US:bquxjob_7162c7e8_1737322af7f&page=queryresults', NULL, 'allow', '{"page": "queryresults", "jobId": "bq:US:bquxjob_7162c7e8_1737322af7f", "project": "metabase-getradical", "section": "bigquery"}', 'jobId: bq:US:bquxjob_7162c7e8_1737322af7f, page: queryresults, project: metabase-getradical, section: bigquery'),
	('1160d12e-1374-4409-9455-997ca1a7384a', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery?p=bigquery-public-data&d=google_analytics_sample&t=ga_sessions_20170801&page=table&project=metabase-getradical', NULL, 'allow', '{"page": "table", "table": "ga_sessions_20170801", "dataset": "google_analytics_sample", "project": "metabase-getradical", "section": "bigquery", "resource": "bigquery-public-data"}', 'dataset: google_analytics_sample, page: table, project: metabase-getradical, resource: bigquery-public-data, section: bigquery, table: ga_sessions_20170801'),
	('f51a1143-f5d2-4a7b-8e7b-bb7cb7447455', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery?project=metabase-getradical&page=jobs', NULL, 'allow', '{"page": "jobs", "project": "metabase-getradical", "section": "bigquery"}', 'page: jobs, project: metabase-getradical, section: bigquery'),
	('d9945dcd-6fe6-4d42-ae9a-5c7a9d5eee69', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery/transfers?project=metabase-getradical', NULL, 'allow', '{"project": "metabase-getradical", "section": "bigquery", "subsection": "transfers"}', 'project: metabase-getradical, section: bigquery, subsection: transfers'),
	('5c633da9-6cd4-4244-80e1-eb6663de31b5', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'https://console.cloud.google.com/bigquery?project=metabase-getradical&page=savedqueries&sq=51531:bef76', NULL, 'allow', '{"page": "savedqueries", "project": "metabase-getradical", "section": "bigquery", "savedqueryId": "51531:bef76"}', 'page: savedqueries, project: metabase-getradical, savedqueryId: 51531:bef76, section: bigquery'),
	('256fe379-2dd9-4d88-8068-2914b6767516', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'https://control.prod.netpurpose.com/qa', NULL, 'allow', '{"env": "prod", "section": "qa"}', 'env: prod, section: qa'),
	('4f13cc98-66cd-4c70-ae53-b95f412e18d2', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'https://control.prod.netpurpose.com/qa/360', NULL, 'allow', '{"id": "360", "env": "prod", "section": "qa"}', 'env: prod, id: 360, section: qa'),
	('32cee4fa-4ebe-4c4b-bafe-5cbf4cd3df16', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'https://control.prod.netpurpose.com/qa', '
    <html>
      <body>
        <div role="presentation">
          <div class="MuiPaper-root">
            <div direction="column">
              <p class="MuiTypography-root jss349 MuiTypography-body1"> Fact ID: 12345 </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  ', 'allow', '{"fact": "12345"}', 'Fact ID: 12345'),
	('e12336ab-354f-4f94-830f-e31c0eaecb2d', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'https://cord.com/#features', NULL, 'allow', '{"section": "features"}', 'Cord: features'),
	('83b5b2f6-2718-4897-b4be-da9a05103995', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'https://cord.com/', NULL, 'deny', NULL, NULL);
INSERT INTO cord.provider_rule_tests VALUES
	('d7558a9f-6598-4b8c-bf81-0f43bfc9995f', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'https://cord.com/data-science/', NULL, 'allow', '{"page": "data-science"}', 'page: data-science'),
	('6668d416-e380-431d-8376-9859751c14c4', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'https://cord.com/about-us/', NULL, 'deny', NULL, NULL),
	('dfacb5bb-d895-47ad-95d5-c9321e4d8caa', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-ds-analytics/42efe-27/identifiers', NULL, 'allow', '{"listId": "42efe-27", "section": "lists"}', 'listId: 42efe-27, section: lists'),
	('7778eb4c-5b1b-4cec-adae-8e107976465c', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/organization/mailerlite/technology', NULL, 'allow', '{"item": "mailerlite", "section": "organization", "subsection": "technology"}', 'item: mailerlite, section: organization, subsection: technology'),
	('60d2d714-0567-47d7-a5ad-39078cbec08d', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/organization/mailerlite/signals_and_news', NULL, 'allow', '{"item": "mailerlite", "section": "organization", "subsection": "signals_and_news"}', 'item: mailerlite, section: organization, subsection: signals_and_news'),
	('7d0c6249-e495-4f45-82a5-5c356c8b3dd9', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/organization/mailerlite', NULL, 'allow', '{"item": "mailerlite", "section": "organization"}', 'item: mailerlite, section: organization'),
	('546a1a35-57da-4628-9060-d07dccdf221d', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/discover/principal.investors', NULL, 'allow', '{"item": "principal.investors", "section": "discover"}', 'item: principal.investors, section: discover'),
	('6a8cb2bf-eea4-4125-8137-4061bc02f920', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/hub/the-netherlands-companies', NULL, 'allow', '{"item": "the-netherlands-companies", "section": "hub"}', 'item: the-netherlands-companies, section: hub'),
	('59502d8f-d567-45c8-a52e-16aca26ae1b6', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/discover/hubs', NULL, 'allow', '{"item": "hubs", "section": "discover"}', 'item: hubs, section: discover'),
	('5429f070-35cf-4edb-95f8-55e60fc9436d', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/discover/organization.companies/3e2e', NULL, 'allow', '{"item": "organization.companies", "itemId": "3e2e", "section": "discover"}', 'item: organization.companies, itemId: 3e2e, section: discover'),
	('f7895220-8bfa-4f47-91e5-86fb6d5ca939', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/discover/saved/hr-tech/9b-d62b', NULL, 'allow', '{"item": "saved", "itemId": "9b-d62b", "section": "discover"}', 'item: saved, itemId: 9b-d62b, section: discover'),
	('1d620907-c5d7-4eab-9f6a-ce01185394bc', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/searches', NULL, 'allow', '{"section": "searches"}', 'section: searches'),
	('ba05f638-3d9b-441b-9981-4a0b8e74ab56', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://www.retool.com/', NULL, 'deny', NULL, NULL),
	('14338786-c4fe-4115-9396-751f6b5dee6b', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://retool.com/', NULL, 'deny', NULL, NULL),
	('0193c175-ef6c-49af-8989-b2b5d08061fa', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-segment-csv-for-crunchbase-csv/110b0-59/organization.companies', NULL, 'allow', '{"listId": "110b0-59", "section": "lists"}', 'listId: 110b0-59, section: lists'),
	('8d4f851a-6599-42a7-9fa5-128897dda7ec', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists', NULL, 'allow', '{"section": "lists"}', 'section: lists'),
	('bf61bf36-b2d3-4e48-b684-c65d134b801e', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/my-follows/my-follows/identifiers', NULL, 'allow', '{"listId": "my-follows", "section": "lists"}', 'listId: my-follows, section: lists'),
	('2fbe577d-08d6-40b0-9c0f-a97fefe24c38', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/', NULL, 'deny', NULL, NULL),
	('a9b7858f-44ef-49e3-9315-0fdd9b311e30', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://crunchbase.com/', NULL, 'deny', NULL, NULL),
	('c10455d9-87d7-455c-9384-933c0a683fea', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://crunchbase.com/home', NULL, 'deny', NULL, NULL),
	('312f7ce5-4a5b-4e71-b553-cc193ba83459', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-ds-analytics/42efe-27/identifiers', '<html><head><title>(25) Foo &lt; Bar | Crunchbase</title></head></html>', 'allow', '{"listId": "42efe-27", "section": "lists"}', 'Foo < Bar'),
	('ae5a47c5-e3bb-4726-abae-1e199e5ed476', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-ds-analytics/42efe-27/identifiers', '<html><head><title>Foo &lt; Bar | Crunchbase</title></head></html>', 'allow', '{"listId": "42efe-27", "section": "lists"}', 'Foo < Bar'),
	('e5cad9ed-72df-4793-9854-c160e7280df2', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-ds-analytics/42efe-27/identifiers', '<html><head><title>(25) Foo &lt; Bar</title></head></html>', 'allow', '{"listId": "42efe-27", "section": "lists"}', 'Foo < Bar'),
	('46da4446-d8df-475c-91d0-6fa1994ba868', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'https://www.crunchbase.com/lists/bi-ds-analytics/42efe-27/identifiers', '<html><head><title>Foo &lt; Bar</title></head></html>', 'allow', '{"listId": "42efe-27", "section": "lists"}', 'Foo < Bar'),
	('a6bfb825-bdf4-4a24-a10e-699a2a8e2bf1', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'https://app.datadoghq.com/infrastructure/map?fillby=avg%3Acpuutilization&sizeby=avg%3Anometric&groupby=availability-zone&nameby=name&nometrichosts=false&tvMode=false&nogrouphosts=true&palette=green_to_orange&paletteflip=false&node_type=host', NULL, 'allow', '{"section": "infrastructure", "subsection": "map"}', 'section: infrastructure, subsection: map'),
	('f2c116f0-6523-4e1f-ace1-7caf325681b4', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'https://app.datadoghq.com/dashboard/cya-zwm-fbp?from_ts=1603883211964&live=true&to_ts=1603886811964', NULL, 'allow', '{"section": "dashboard", "subsection": "cya-zwm-fbp"}', 'section: dashboard, subsection: cya-zwm-fbp'),
	('570ae0bd-262a-4236-b192-39e5a2804f7c', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'https://app.datadoghq.com/monitors/triggered?q=', NULL, 'allow', '{"section": "monitors", "subsection": "triggered"}', 'section: monitors, subsection: triggered'),
	('11dee2e3-ab98-4191-87b2-1c1cab009b57', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'https://app.datadoghq.com/dashboard/cya-zwm-fbp/nimrods-timeboard-28-oct-2020-1206?from_ts=1603885245842&live=true&to_ts=1603888845842', NULL, 'allow', '{"section": "dashboard", "subsection": "cya-zwm-fbp", "dashboardName": "nimrods-timeboard-28-oct-2020-1206"}', 'dashboardName: nimrods-timeboard-28-oct-2020-1206, section: dashboard, subsection: cya-zwm-fbp'),
	('5a281f91-9e29-46e5-9b73-b46728ae283c', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'https://app.datadoghq.com/account/login?next=%2Fnimrods&live=true&to_ts=1603888845842', NULL, 'deny', NULL, NULL),
	('dbeca7c5-0887-4ad9-8077-7a53737ee4dd', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/?supportSignUp=true&message=Your%20email.&#/56554/b/np_dev/overview', NULL, 'allow', '{"account": "56554", "section": "overview"}', 'account: 56554, section: overview'),
	('31cd5d17-5f87-4a05-a9cc-1bf0cc10d821', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/#/56554/b/np_dev/run/20951', NULL, 'allow', '{"account": "56554", "section": "run", "objectId": "20951"}', 'account: 56554, objectId: 20951, section: run'),
	('cdc59ad5-2a10-4116-88cb-e5d5fdd0dc98', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/#/56554/overview', NULL, 'allow', '{"account": "56554", "section": "overview"}', 'account: 56554, section: overview'),
	('895b8980-b957-4903-855c-9f5f1d9932f4', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/#/56554/e/production/overview', NULL, 'allow', '{"account": "56554", "section": "overview"}', 'account: 56554, section: overview'),
	('3366bdbb-b75e-4f42-8812-272e636e5559', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/#/56554/b/np_dev/file/definitions%2Fusers_d.sqlx', NULL, 'allow', '{"account": "56554", "section": "file", "objectId": "definitions%2Fusers_d.sqlx"}', 'account: 56554, objectId: definitions%2Fusers_d.sqlx, section: file'),
	('df1267a4-5332-453a-a959-85219fe88d93', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'https://app.dataform.co/#/56554/b/np_dev/catalog/dataform.users_d', NULL, 'allow', '{"account": "56554", "section": "catalog", "objectId": "dataform.users_d"}', 'account: 56554, objectId: dataform.users_d, section: catalog'),
	('ef6cb621-10bf-464b-821e-92c2778ad19b', 'b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'https://datastudio.google.com/u/0/reporting/1HOYGPA8-XY/page/tWDGB/edit', NULL, 'allow', '{"longId": "1HOYGPA8-XY", "section": "reporting", "shortId": "tWDGB"}', 'longId: 1HOYGPA8-XY, section: reporting, shortId: tWDGB'),
	('450baae3-ac95-452a-95f6-fd9386667df2', 'b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'https://datastudio.google.com/u/0/explorer/9689eead-25', NULL, 'allow', '{"longId": "9689eead-25", "section": "explorer"}', 'longId: 9689eead-25, section: explorer'),
	('a22d5757-f297-4759-9471-f44d903f49c5', 'fc48f4d2-509a-4323-b49b-6365492bd93a', 'https://deliveroo.co.uk/menu/london/london-bridge/chilango-london-bridge?day=today&postcode=SE164PN&time=ASAP', NULL, 'allow', '{"city": "london", "slug": "chilango-london-bridge"}', 'city: london, slug: chilango-london-bridge'),
	('cdaa0ac8-e3b0-44c4-8a01-69a80136b0be', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Dashboard/01Z9kUAE/view?queryScope=userFolders', NULL, 'allow', '{"action": "view", "object": "Dashboard", "objectId": "01Z9kUAE"}', 'action: view, object: Dashboard, objectId: 01Z9kUAE'),
	('201b28f8-ea32-4bf4-a3aa-eca55aa74866', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/o/Opportunity/list?filterName=Recent', NULL, 'allow', '{"action": "list", "object": "Opportunity"}', 'action: list, object: Opportunity'),
	('42092da0-723d-416a-bfba-2f9569773d84', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Opportunity/06K06cQAA/view', NULL, 'allow', '{"action": "view", "object": "Opportunity", "objectId": "06K06cQAA"}', 'action: view, object: Opportunity, objectId: 06K06cQAA'),
	('b683f264-a30c-48c1-bda4-e085d5c60e5f', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/page/home', NULL, 'allow', '{"action": "home", "object": "page"}', 'action: home, object: page'),
	('e26f4b07-d061-4605-b0a1-d93768a903b0', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um4.lightning.force.com/lightning/o/Account/list?filterName=Recent', NULL, 'allow', '{"action": "list", "object": "Account"}', 'action: list, object: Account'),
	('72f1653c-6ff1-45c2-a85e-9c8d9e2a51e3', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Account/04KurQAA/view', NULL, 'allow', '{"action": "view", "object": "Account", "objectId": "04KurQAA"}', 'action: view, object: Account, objectId: 04KurQAA'),
	('025400fd-e096-461b-87c8-c426e32ace8b', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/User/05K0bkQAA/view', NULL, 'allow', '{"action": "view", "object": "User", "objectId": "05K0bkQAA"}', 'action: view, object: User, objectId: 05K0bkQAA'),
	('bc6d9f88-a567-4ec3-ba1a-9f6bf87348aa', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/AccountContactRelations/view', NULL, 'allow', '{"action": "view", "object": "AccountContactRelations", "objectId": "04K0urQAA"}', 'action: view, object: AccountContactRelations, objectId: 04K0urQAA'),
	('6a4e4bfe-157a-402d-95f6-3d6f2b5541ab', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/Opportunities/view', NULL, 'allow', '{"action": "view", "object": "Opportunities", "objectId": "04K0urQAA"}', 'action: view, object: Opportunities, objectId: 04K0urQAA'),
	('0e5887e1-4bec-49aa-8b36-754252d963cb', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/AttachedContentNotes/view', NULL, 'allow', '{"action": "view", "object": "AttachedContentNotes", "objectId": "04K0urQAA"}', 'action: view, object: AttachedContentNotes, objectId: 04K0urQAA'),
	('12e2ea15-3cfb-423e-bb0c-9ebde2a126da', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/CampaignInfluences/view', NULL, 'allow', '{"action": "view", "object": "CampaignInfluences", "objectId": "04K0urQAA"}', 'action: view, object: CampaignInfluences, objectId: 04K0urQAA'),
	('81be1caa-9f29-419d-8cee-ef136290809b', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/Contracts/view', NULL, 'allow', '{"action": "view", "object": "Contracts", "objectId": "04K0urQAA"}', 'action: view, object: Contracts, objectId: 04K0urQAA'),
	('b7c064f9-2a8e-4d32-9400-64bb73a05c34', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/04K0urQAA/related/Cases/view', NULL, 'allow', '{"action": "view", "object": "Cases", "objectId": "04K0urQAA"}', 'action: view, object: Cases, objectId: 04K0urQAA'),
	('c6b647da-4e18-459b-91b3-b86156034f7a', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Task/0T4K0aBUAU/view', NULL, 'allow', '{"action": "view", "object": "Task", "objectId": "0T4K0aBUAU"}', 'action: view, object: Task, objectId: 0T4K0aBUAU'),
	('c8723348-ffb2-4429-80c7-6b3e311c5916', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Lead/0Q4K0jLUAU/view', NULL, 'allow', '{"action": "view", "object": "Lead", "objectId": "0Q4K0jLUAU"}', 'action: view, object: Lead, objectId: 0Q4K0jLUAU'),
	('c202ca3d-a322-4544-90b2-4c92b64d69c3', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/o/Task/home', NULL, 'allow', '{"action": "home", "object": "Task"}', 'action: home, object: Task'),
	('394ee7ec-7661-4c1a-b0ab-6e53d7c6d7a0', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/o/Event/home', NULL, 'allow', '{"action": "home", "object": "Event"}', 'action: home, object: Event'),
	('da12bf0e-9b04-456e-93bc-de237d5a59a8', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/r/Event/0U4K00eaUAC/view', NULL, 'allow', '{"action": "view", "object": "Event", "objectId": "0U4K00eaUAC"}', 'action: view, object: Event, objectId: 0U4K00eaUAC'),
	('b9534170-00f9-4af9-86c5-16e75e47ec7f', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/o/Dashboard/home?queryScope=everything', NULL, 'allow', '{"action": "home", "object": "Dashboard"}', 'action: home, object: Dashboard'),
	('cb9f777b-ad0f-4fde-bc76-7d9d31e2874f', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.lightning.force.com/lightning/o/Report/home?queryScope=mru', NULL, 'allow', '{"action": "home", "object": "Report"}', 'action: home, object: Report'),
	('394dc759-0960-4624-ae04-72bc5b44fc5e', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'https://um6.salesforce.com/_ui/sales/forecasting/ui/ForecastingTabPage', NULL, 'allow', '{"object": "ForecastingTabPage", "section": "forecasting"}', 'object: ForecastingTabPage, section: forecasting'),
	('6ddbc8c4-e08a-403d-9cd7-a8c9730178cf', '9102c8b1-b4a7-4dda-9db1-888e6266230f', 'https://framer.com/share/zVjYy/gSLUcBiyE?editor=1', NULL, 'allow', '{"page": "gSLUcBiyE", "project": "zVjYy", "section": "share"}', 'page: gSLUcBiyE, project: zVjYy, section: share'),
	('a4a8ce2a-962d-4002-8097-8d981ffc45ea', '9102c8b1-b4a7-4dda-9db1-888e6266230f', 'https://framer.com/projects/7ngdkW-bfoG0?node=RdOjVGaqN-page', NULL, 'allow', '{"project": "7ngdkW-bfoG0", "section": "projects"}', 'project: 7ngdkW-bfoG0, section: projects'),
	('ccae6df6-4a94-4ff5-b796-293fac081b18', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'https://cloud.getdbt.com/#/accounts/10650/projects/16595/develop/', NULL, 'allow', '{"section": "develop", "accountId": "10650", "projectId": "16595"}', 'accountId: 10650, projectId: 16595, section: develop'),
	('af3936c7-fd2a-4546-be5f-fc80025ca73b', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'https://cloud.getdbt.com/#/accounts/10650/projects/16595/environments/16038/', NULL, 'allow', '{"section": "environments", "objectId": "16038", "accountId": "10650", "projectId": "16595"}', 'accountId: 10650, objectId: 16038, projectId: 16595, section: environments'),
	('8b644a4d-bbda-452a-9819-e2803ae63d27', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'https://cloud.getdbt.com/#/accounts/10650/projects/16595/environments/16038/settings/', NULL, 'allow', '{"section": "environments", "objectId": "16038", "accountId": "10650", "projectId": "16595", "subsection": "settings"}', 'accountId: 10650, objectId: 16038, projectId: 16595, section: environments, subsection: settings'),
	('a60adae8-8b6d-4279-9cbe-39986139274d', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'https://cloud.getdbt.com/#/accounts/10650/projects/16595/runs/12226199/', NULL, 'allow', '{"section": "runs", "objectId": "12226199", "accountId": "10650", "projectId": "16595"}', 'accountId: 10650, objectId: 12226199, projectId: 16595, section: runs'),
	('1a83b706-b22b-400c-bfd6-c55de1462741', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/BankRec/BankRec.aspx?accountID=7A690C', NULL, 'allow', '{"id": "7A690C", "section": "BankRec", "subsection": "BankRec.aspx"}', 'id: 7A690C, section: BankRec, subsection: BankRec.aspx'),
	('0c21c19e-8596-4538-9d01-1b254ce0cac3', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Bank/EditBankRecRule.aspx?bankAccountID=7a690c7b-5c&statementLineID=51e93d0e-c7&returnTo=bankrec&returnToPageNumber=1', NULL, 'allow', '{"id": "7a690c7b-5c", "section": "Bank", "subsection": "EditBankRecRule.aspx"}', 'id: 7a690c7b-5c, section: Bank, subsection: EditBankRecRule.aspx'),
	('3975936f-3389-479c-836e-bb01f86e2308', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Bank/EditBankRecRule.aspx?type=BANKRULETYPE/CASHPAY&bankAccountID=7a690c7b-5c&statementLineID=51e93d0e-c7&returnTo=bankrec&returnToPageNumber=', NULL, 'allow', '{"id": "7a690c7b-5c", "section": "Bank", "subsection": "EditBankRecRule.aspx"}', 'id: 7a690c7b-5c, section: Bank, subsection: EditBankRecRule.aspx'),
	('e3d6c159-dd35-4045-80d1-911641dcb7d7', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Reports/Report.aspx?reportId=e267eb51-20&statement=4AD6A8E6-E5&fromDate=01+Apr+2020&toDate=30+Apr+2020&reportClass=BankSummary', NULL, 'allow', '{"id": "e267eb51-20", "section": "Reports", "subsection": "Report.aspx"}', 'id: e267eb51-20, section: Reports, subsection: Report.aspx'),
	('5d483b8c-5b17-475f-aa10-138d928f2c8c', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://reporting.xero.com/!0XJ8p/v2/BusinessSnapshot/', NULL, 'allow', '{"id": "!0XJ8p", "section": "cashflow", "subsection": "BusinessSnapshot"}', 'id: !0XJ8p, section: cashflow, subsection: BusinessSnapshot'),
	('6a33f59d-7ef9-4804-b63b-80b142175e5b', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/cashflow/!0XJ8p/onboarding', NULL, 'allow', '{"id": "!0XJ8p", "section": "cashflow"}', 'id: !0XJ8p, section: cashflow'),
	('0e7996de-781f-4846-afa2-439f7b27f9e9', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/cashflow/!0XJ8p', NULL, 'allow', '{"id": "!0XJ8p", "section": "cashflow"}', 'id: !0XJ8p, section: cashflow'),
	('dbab4431-3730-43d5-a95a-1fb723d0da68', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS%2fPAID&graphSearch=False&dateWithin=any&unsentOnly=False&page=2&PageSize=25&orderBy=InvoiceDate&direction=DESC', NULL, 'allow', '{"tab": "INVOICESTATUS/PAID", "section": "AccountsReceivable", "subsection": "Search.aspx"}', 'section: AccountsReceivable, subsection: Search.aspx, tab: INVOICESTATUS/PAID'),
	('42aab0c4-8e29-4433-a64e-73302b10c9ea', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/AccountsReceivable/ViewCreditNote.aspx?creditNoteID=6e9a28bf-53', NULL, 'allow', '{"id": "6e9a28bf-53", "section": "AccountsReceivable", "subsection": "ViewCreditNote.aspx"}', 'id: 6e9a28bf-53, section: AccountsReceivable, subsection: ViewCreditNote.aspx'),
	('37955424-112a-4fc7-ae9a-bd78bc33f8f0', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=e966b8ac-fa', NULL, 'allow', '{"id": "e966b8ac-fa", "section": "AccountsReceivable", "subsection": "View.aspx"}', 'id: e966b8ac-fa, section: AccountsReceivable, subsection: View.aspx'),
	('427e9057-d5fe-43d5-b938-98759c7a1be7', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=&graphSearch=False&dateWithin=any&unsentOnly=False&page=2&PageSize=25&orderBy=InvoiceDate&direction=DESC', NULL, 'allow', '{"section": "AccountsReceivable", "subsection": "Search.aspx"}', 'section: AccountsReceivable, subsection: Search.aspx'),
	('168526e6-39d7-4bd9-a851-99498f21c903', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Contacts/View/d3f7b2ed-22', NULL, 'allow', '{"id": "d3f7b2ed-22", "section": "Contacts", "subsection": "View"}', 'id: d3f7b2ed-22, section: Contacts, subsection: View'),
	('7ba1c617-0b23-4621-a276-cfbf7c7f7663', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://www.tryretool.com/', NULL, 'deny', NULL, NULL),
	('2e87e404-bebf-4ade-b1e3-783c374ca323', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Accounts/Receivable/Dashboard/', NULL, 'allow', '{"id": "Dashboard", "section": "Accounts", "subsection": "Receivable"}', 'id: Dashboard, section: Accounts, subsection: Receivable'),
	('1fdb5a90-62bc-455c-81df-d98cd13db04c', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Reports/Report.aspx?reportId=97168d17-7b&report=&statement=a22c12ce-7b&attPage=Compare%20Periods&date=31%20Jul%202020&timeframe=1&periods=4&budgetID=%20&total=on&ytd=on&fromDate=1%20Jul%202020&toDate=31%20Jul%202020&CompareDateRangePeriod=none&CompareDateRangePeriods=1&sortByForAccount=MagicReportSortableName&CurrencyCode=CURR%2FGBP&cashOnly=null', NULL, 'allow', '{"id": "97168d17-7b", "section": "Reports", "subsection": "Report.aspx"}', 'id: 97168d17-7b, section: Reports, subsection: Report.aspx'),
	('a32a3121-0738-43d6-8189-621112ad7fc9', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://reporting.xero.com/!0XJ8p/v1/Run/1217', NULL, 'allow', '{"id": "!0XJ8p", "run": "1217", "section": "reporting"}', 'id: !0XJ8p, run: 1217, section: reporting'),
	('811c5b30-55e3-4941-b443-d4986beb0609', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'https://go.xero.com/Contacts/Search/?contactType=CONTYPE%2FALL', NULL, 'allow', '{"tab": "CONTYPE/ALL", "section": "Contacts", "subsection": "Search"}', 'section: Contacts, subsection: Search, tab: CONTYPE/ALL'),
	('9944a069-e2a6-4dde-b287-1b25838a28d0', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'https://grid.is/@np/basic-model-taJ_3gC', NULL, 'allow', '{"page": "basic-model-taJ_3gC", "section": "@np"}', 'page: basic-model-taJ_3gC, section: @np'),
	('befc8c97-a599-43f6-8b27-dcb58e7b158c', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'https://grid.is/@np/', NULL, 'allow', '{"section": "@np"}', 'section: @np'),
	('abc0b9df-d7d9-4dbc-af3f-4bd9a6bc050e', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'https://www.grid.is/', NULL, 'deny', NULL, NULL),
	('3b5643cf-43a2-4c9f-871a-58951aa93b74', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'https://grid.is/', NULL, 'deny', NULL, NULL),
	('197130ff-6b1e-4f8b-afb7-9e25c463dc11', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'https://heapanalytics.com/app/dashboard/test-182721', NULL, 'allow', '{"section": "dashboard", "subsection": "test-182721"}', 'section: dashboard, subsection: test-182721'),
	('4df06b48-a556-4f27-b1f0-af561a256227', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'https://heapanalytics.com/app/influence/23925854', NULL, 'allow', '{"section": "influence", "subsection": "23925854"}', 'section: influence, subsection: 23925854'),
	('2681e2bf-f696-4327-8930-3334e1e69788', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'https://heapanalytics.com/app/definitions?view=properties&type=property&id=identity-identity%3Auser%3Abuiltin', NULL, 'allow', '{"page": "properties", "section": "definitions", "objectId": "identity-identity:user:builtin"}', 'objectId: identity-identity:user:builtin, page: properties, section: definitions'),
	('b0dd02d8-63de-42a9-b43d-8c4a7f02f17e', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'https://heapanalytics.com/app/definitions?view=properties', NULL, 'allow', '{"page": "properties", "section": "definitions"}', 'page: properties, section: definitions'),
	('3a9ac582-f015-4fa0-9f87-b1b0cf97b916', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'https://heapanalytics.com/app/report', NULL, 'allow', '{"section": "report"}', 'section: report'),
	('01675afb-fdd4-44ee-9f4d-91623b3ea02f', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'https://insights.hotjar.com/sites/1857452/heatmap/report/6090788?device=desktop&type=click', NULL, 'allow', '{"type": "click", "device": "desktop", "siteId": "1857452", "section": "heatmap", "reportId": "6090788", "subsection": "report"}', 'device: desktop, reportId: 6090788, section: heatmap, siteId: 1857452, subsection: report, type: click'),
	('0455a773-26a4-46d6-9d04-b0ce6198d549', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'https://insights.hotjar.com/sites/1857452/heatmap/list', NULL, 'allow', '{"siteId": "1857452", "section": "heatmap", "subsection": "list"}', 'section: heatmap, siteId: 1857452, subsection: list'),
	('8138efa5-3c44-4fcd-85dd-335d9bf3ee57', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'https://insights.hotjar.com/r?site=1857452&recording=3857343848', NULL, 'allow', '{"siteId": "1857452", "section": "recordings", "recordingId": "3857343848"}', 'recordingId: 3857343848, section: recordings, siteId: 1857452'),
	('875d4158-4a7f-491a-8d64-252170736fc7', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'https://insights.hotjar.com/sites/1857452/playbacks/list?segment=-1', NULL, 'allow', '{"siteId": "1857452", "section": "playbacks", "segmentId": "-1", "subsection": "list"}', 'section: playbacks, segmentId: -1, siteId: 1857452, subsection: list'),
	('1faf80b1-d316-4c6b-b4b4-aa1564295e34', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/contacts/list/view/all/', NULL, 'allow', '{"view": "list", "section": "contacts", "segment": "all", "accountId": "7806833", "objectType": "contacts", "subsection": "view"}', 'accountId: 7806833, objectType: contacts, section: contacts, segment: all, subsection: view, view: list'),
	('f03836f8-3249-47ff-a94c-7ef384dd042b', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/objects/0-1/views/all/list', NULL, 'allow', '{"view": "0-1", "section": "contacts", "segment": "all", "accountId": "7806833", "objectType": "objects", "subsection": "views", "subsegment": "list"}', 'accountId: 7806833, objectType: objects, section: contacts, segment: all, subsection: views, subsegment: list, view: 0-1'),
	('661d9488-28e5-4787-9084-c180ac41d0d2', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/contacts/list/view/3952156/', NULL, 'allow', '{"view": "list", "section": "contacts", "segment": "3952156", "accountId": "7806833", "objectType": "contacts", "subsection": "view"}', 'accountId: 7806833, objectType: contacts, section: contacts, segment: 3952156, subsection: view, view: list'),
	('b37b9ddd-ea82-4d17-8be9-8bd51d383b94', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/deals/board/view/all/', NULL, 'allow', '{"view": "board", "section": "contacts", "segment": "all", "accountId": "7806833", "objectType": "deals", "subsection": "view"}', 'accountId: 7806833, objectType: deals, section: contacts, segment: all, subsection: view, view: board'),
	('ed37455b-a32d-43ba-aabb-3dd43157cc93', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/contact/501/', NULL, 'allow', '{"section": "contacts", "objectId": "501", "accountId": "7806833", "objectType": "contact"}', 'accountId: 7806833, objectId: 501, objectType: contact, section: contacts');
INSERT INTO cord.provider_rule_tests VALUES
	('263f49db-aae5-4b52-9bfd-091147eebc45', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/contacts/7806833/objects/0-1/views/3952156/list', NULL, 'allow', '{"view": "0-1", "section": "contacts", "segment": "3952156", "accountId": "7806833", "objectType": "objects", "subsection": "views", "subsegment": "list"}', 'accountId: 7806833, objectType: objects, section: contacts, segment: 3952156, subsection: views, subsegment: list, view: 0-1'),
	('24b69082-55e8-4cb9-91ee-be1efc4bc889', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/email/7806833/edit/4110/settings', NULL, 'allow', '{"view": "settings", "section": "email", "objectId": "4110", "accountId": "7806833", "subsection": "edit"}', 'accountId: 7806833, objectId: 4110, section: email, subsection: edit, view: settings'),
	('7d2e4899-11fb-445c-812f-f5fe5488accc', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/email/7806833/manage/state/sent', NULL, 'allow', '{"view": "sent", "section": "email", "objectId": "state", "accountId": "7806833", "subsection": "manage"}', 'accountId: 7806833, objectId: state, section: email, subsection: manage, view: sent'),
	('ec685cb3-a42e-4c4a-a879-00fabb0d2892', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/email/7806833/analyze', NULL, 'allow', '{"section": "email", "accountId": "7806833", "subsection": "analyze"}', 'accountId: 7806833, section: email, subsection: analyze'),
	('9590a904-7422-4ea4-a38f-f45ba02f8082', '91560f94-8d01-4370-a4ec-b50ce097295b', 'https://app.hubspot.com/email/7806833/manage/state/all', NULL, 'allow', '{"view": "all", "section": "email", "objectId": "state", "accountId": "7806833", "subsection": "manage"}', 'accountId: 7806833, objectId: state, section: email, subsection: manage, view: all'),
	('eccdb2e2-d764-4268-be5c-9de25e9f6203', '26b741d2-67cd-4fa4-93ce-c7ce28402b54', 'https://studio.lambda.hvmd.io/dashboard', NULL, 'allow', '{"section": "dashboard"}', 'section: dashboard'),
	('c5f82ad6-498b-43c3-a658-ce04a7b3b1c2', '74987f27-86b4-4c18-8387-eed009535254', 'https://secure.internal.io/spaces/monthly-kp-is/edit', NULL, 'allow', '{"action": "edit", "section": "spaces", "subsection": "monthly-kp-is"}', 'action: edit, section: spaces, subsection: monthly-kp-is'),
	('6e085ae8-21b9-485c-9f38-05f3875aada0', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://tryretool.com/', NULL, 'deny', NULL, NULL),
	('f024c748-da1c-4d0a-b187-d9949b7206cc', '74987f27-86b4-4c18-8387-eed009535254', 'https://secure.internal.io/settings/data-sources/RGF0YVN', NULL, 'allow', '{"action": "RGF0YVN", "section": "settings", "subsection": "data-sources"}', 'action: RGF0YVN, section: settings, subsection: data-sources'),
	('3c0b6fa0-f519-463f-9298-787f4334f30c', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://linkedin.com/company/getradical/', '<html><head><title>Radical | LinkedIn</title></head></html>', 'allow', '{"company": "getradical"}', 'Radical'),
	('35bec322-9374-44a7-847f-546605c54d7b', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/jobs/view/12345/?eBP=JYMBII_JOBS_HOME_ORGANIC&recommendedFlavor=ACTIVELY_HIRING_COMPANY', NULL, 'allow', '{"job": "12345"}', 'job: 12345'),
	('136808dc-119b-42b1-85f7-1176b03f149a', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/jobs/search/?alternateChannel=jymbii&alternateCode=seturl&currentJobId=12345&eBP=JYMBII_JOBS_HOME_ORGANIC', NULL, 'allow', '{"job": "12345"}', 'job: 12345'),
	('b5f95e50-8d03-4bc0-8266-f4f45ae13c60', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/feed/hashtag/futurism/', NULL, 'allow', '{"hashtag": "futurism"}', '#futurism'),
	('ec33e197-7373-4ad6-808c-23772f6fe02d', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/', NULL, 'deny', NULL, NULL),
	('3943bffb-f7d8-46e1-8ef3-0e9f69cfed75', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://linkedin.com/', NULL, 'deny', NULL, NULL),
	('cd6be922-6ca8-4d82-a7c8-596135b0d147', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://linkedin.com/feed', NULL, 'deny', NULL, NULL),
	('9489232e-4e6f-4f9c-8654-6d19a1b5eed6', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/sales/lists/people/66453?sortCriteria=CREATED_TIME', NULL, 'allow', '{"personId": "66453"}', 'personId: 66453'),
	('0bc4d89d-077a-4f1c-84bc-0741765e33b4', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/sales/lists/people', NULL, 'allow', '{"section": "people"}', 'section: people'),
	('32f32f39-0181-4178-b544-2d38c97cd64d', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/sales/company/37431094/insights', NULL, 'allow', '{"section": "insights", "companyId": "37431094"}', 'companyId: 37431094, section: insights'),
	('5839af56-a483-4b0a-97f6-b7727c46d1de', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/sales/company/37431094/people', NULL, 'allow', '{"section": "people", "companyId": "37431094"}', 'companyId: 37431094, section: people'),
	('df8b475f-0de0-448c-91ca-27503931059d', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/leadgen-forms', NULL, 'allow', '{"product": "campaignmanager", "section": "leadgen-forms", "accountId": "508201584"}', 'accountId: 508201584, product: campaignmanager, section: leadgen-forms'),
	('eae26db1-c979-45c1-80b5-129fb3792ff4', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/performance-chart?campaignGroupIds=%5B607579886%5D&campaignIds=%5B146458586%5D&creativeIds=%5B78554666%5D&dateRange=%7B%22startDate%22%3A%2210%2F13%2F2020%22%2C%22endDate%22%3A%2211%2F11%2F2020%22%7D&isChartingAll=false&selectedMetric=baseMetrics.clicks', NULL, 'allow', '{"product": "campaignmanager", "section": "performance-chart", "accountId": "508201584"}', 'accountId: 508201584, product: campaignmanager, section: performance-chart'),
	('10076fa7-726e-42c5-be63-2f3d5a24a5e8', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/campaigns/146458586/details', NULL, 'allow', '{"product": "campaignmanager", "section": "campaigns", "accountId": "508201584", "campaignId": "146458586", "subsection": "details"}', 'accountId: 508201584, campaignId: 146458586, product: campaignmanager, section: campaigns, subsection: details'),
	('a0cd1f31-44e3-4037-a8b5-a28cdd97c19f', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/campaigns/146458586/review', NULL, 'allow', '{"product": "campaignmanager", "section": "campaigns", "accountId": "508201584", "campaignId": "146458586", "subsection": "review"}', 'accountId: 508201584, campaignId: 146458586, product: campaignmanager, section: campaigns, subsection: review'),
	('28cd08ad-7594-4c27-abe0-6af5ec130f48', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/campaigns/146458586/creatives', NULL, 'allow', '{"product": "campaignmanager", "section": "campaigns", "accountId": "508201584", "campaignId": "146458586", "subsection": "creatives"}', 'accountId: 508201584, campaignId: 146458586, product: campaignmanager, section: campaigns, subsection: creatives'),
	('7eb3df20-47da-449f-8b64-3da86e2fc65f', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/creatives?campaignGroupIds=%5B607579886%5D&campaignIds=%5B146458586%5D', NULL, 'allow', '{"product": "campaignmanager", "section": "creatives", "accountId": "508201584"}', 'accountId: 508201584, product: campaignmanager, section: creatives'),
	('7d599ead-fd4e-4f2e-84e7-8b03a1c90788', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/campaigns?campaignGroupIds=%5B607579886%5D', NULL, 'allow', '{"product": "campaignmanager", "section": "campaigns", "accountId": "508201584"}', 'accountId: 508201584, product: campaignmanager, section: campaigns'),
	('deecbf38-df09-4a6a-95ab-2697543e20d8', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'https://www.linkedin.com/campaignmanager/accounts/508201584/campaign-groups', NULL, 'allow', '{"product": "campaignmanager", "section": "campaign-groups", "accountId": "508201584"}', 'accountId: 508201584, product: campaignmanager, section: campaign-groups'),
	('3c47aaab-0538-4659-88d0-ae60812fe1d9', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'http://localhost/', NULL, 'allow', '{"context": "localhost"}', 'context: localhost'),
	('17a8e463-b176-42bf-852f-54ca449e5ba8', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'http://andrei.localhost/', NULL, 'allow', '{"subdomain": "andrei"}', 'subdomain: andrei'),
	('592b75b0-fad2-4a99-86e3-9e872c1a69f0', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'https://0.0.0.0:8179/whatever', NULL, 'allow', '{"workspace": "whatever"}', 'workspace: whatever'),
	('16f1b05f-6705-4176-8fc3-e1f283b3fb4f', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'https://0.0.0.0:8179/whatever#andrei', NULL, 'allow', '{"workspace": "whatever"}', 'workspace: whatever'),
	('0ad0b575-cadb-471f-a301-59ab741a6f0e', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/templates/edit?id=181865', NULL, 'allow', '{"id": "181865", "section": "templates", "subsection": "edit"}', 'id: 181865, section: templates, subsection: edit'),
	('bfe8f0d1-0edc-456e-9152-4f72ce1a220f', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/campaigns/show?id=282945', NULL, 'allow', '{"id": "282945", "section": "campaigns", "subsection": "show"}', 'id: 282945, section: campaigns, subsection: show'),
	('7c1ff54d-91c9-46fa-ac96-150000a73dd7', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/lists/members/view?id=138651801&use_segment=Y', NULL, 'allow', '{"id": "138651801", "action": "view", "section": "lists", "subsection": "members"}', 'action: view, id: 138651801, section: lists, subsection: members'),
	('cefc2d5e-9591-408e-92c0-ace11c02b1e1', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/lists/designer/?id=56469', NULL, 'allow', '{"id": "56469", "section": "lists", "subsection": "designer"}', 'id: 56469, section: lists, subsection: designer'),
	('982477cd-b9a2-4f1f-b72b-95f786ad242d', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/audience/', NULL, 'allow', '{"section": "audience"}', 'section: audience'),
	('a52e9153-841a-47b9-b37a-d7a3a60f8a36', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/lists/dashboard/signup-forms?id=56469', NULL, 'allow', '{"id": "56469", "action": "signup-forms", "section": "lists", "subsection": "dashboard"}', 'action: signup-forms, id: 56469, section: lists, subsection: dashboard'),
	('9f634ac4-8daf-461d-859c-759dc56a2e0f', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'https://us4.admin.mailchimp.com/lists/members?id=56469#p:1-s:25-sa:last_update_time-so:false', NULL, 'allow', '{"id": "56469", "section": "lists", "subsection": "members"}', 'id: 56469, section: lists, subsection: members'),
	('56bb5d84-6ef6-4b15-8427-31d628d1c37e', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://covid.medium.com/it-probably-3061a2', NULL, 'allow', '{"page": "it-probably-3061a2", "section": "covid"}', 'page: it-probably-3061a2, section: covid'),
	('e8da31ca-a97f-4b79-a153-a886323c5e8e', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://medium.com/@getradical/the-missing-piece-58b5', NULL, 'allow', '{"page": "the-missing-piece-58b5", "section": "@getradical"}', 'page: the-missing-piece-58b5, section: @getradical'),
	('e1728f91-27bb-4373-866d-775b85412edc', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://www.medium.com/@getradical/the-missing-piece-58b5', NULL, 'allow', '{"page": "the-missing-piece-58b5", "section": "@getradical"}', 'page: the-missing-piece-58b5, section: @getradical'),
	('300bafd6-16a7-445d-b0ba-5bea75803e79', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://www.medium.com/', NULL, 'deny', NULL, NULL),
	('74ca9f3c-7c2d-4091-8060-b237a6a89ddc', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://medium.com/', NULL, 'deny', NULL, NULL),
	('d4820bb2-8ec8-483a-b314-1d3c466449b6', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'https://medium.com/me/stats', NULL, 'deny', NULL, NULL),
	('dd25bbf0-cfbf-4989-99c7-a5897324efda', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'https://eu.mixpanel.com/report/2255376/view/2802692/insights#report/10669747/tete', NULL, 'allow', '{"section": "insights", "reportId": "10669747", "accountId": "2255376", "projectId": "2802692"}', 'accountId: 2255376, projectId: 2802692, reportId: 10669747, section: insights'),
	('8e2a52de-e5e7-4f3d-bb06-797c1593e0ef', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'https://eu.mixpanel.com/report/2255376/view/2802692/dashboards#id=801636', NULL, 'allow', '{"section": "dashboards", "accountId": "2255376", "projectId": "2802692", "dashboardId": "801636"}', 'accountId: 2255376, dashboardId: 801636, projectId: 2802692, section: dashboards'),
	('7e98e4e7-a591-4d96-9af6-05d54f3ed9b2', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'https://mixpanel.com/report/2195193/view/139237/entity-management#~(entityType~cohorts)', NULL, 'allow', '{"section": "entity-management", "accountId": "2195193", "projectId": "139237"}', 'accountId: 2195193, projectId: 139237, section: entity-management'),
	('f2a9a981-e099-4593-bc6d-a4c9190bad2d', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'https://mixpanel.com/report/2195193/view/139237/flows#', NULL, 'allow', '{"section": "flows", "accountId": "2195193", "projectId": "139237"}', 'accountId: 2195193, projectId: 139237, section: flows'),
	('56282d4f-3dd2-4208-aae5-26b5d022d49f', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'https://radical.phacility.com/D10', '<html><head><title>(123) ⚙ D10 Foo</title></head></html>', 'allow', '{"diff": "10"}', '⚙ D10 Foo'),
	('de6d9199-c432-4120-92d0-803b1f0cf724', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'https://radical.phacility.com/T67', '<html><head><title>(123) ⚓ T67 Foo</title></head></html>', 'allow', '{"task": "67"}', '⚓ T67 Foo'),
	('c943bb2d-b00a-4667-8863-be8df59f47d9', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'https://radical.phacility.com/macro/', '<html><head><title>(123) ⚘ Query: Active</title></head></html>', 'allow', '{"pathname": "/macro/"}', '⚘ Query: Active'),
	('87572310-c206-463e-a1fa-efcb279e99cf', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'https://radical.phacility.com/harbormaster/plan/2/', '<html><head><title>(123) ♻ arc lint + arc unit</title></head></html>', 'allow', '{"pathname": "/harbormaster/plan/2/"}', '♻ arc lint + arc unit'),
	('327f3db8-50d5-49db-9158-3ec5ca3854ee', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'https://radical.phacility.com/', '<html><head><title>(123) Home</title></head></html>', 'allow', '{"pathname": "/"}', 'Home'),
	('7b0e19e1-ac63-4d25-bcdc-9aeb3a4bcf05', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/superset/welcome', NULL, 'allow', '{"section": "superset", "workspace": "e9accd3f", "subsection": "welcome"}', 'section: superset, subsection: welcome, workspace: e9accd3f'),
	('abf37a43-1e8d-4a0a-bc7b-0f61a6690b33', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/databaseview/list/?filters=%5B%5D&pageIndex=0&sortColumn=changed_on_delta_humanized&sortOrder=desc', NULL, 'allow', '{"section": "databaseview", "workspace": "e9accd3f", "subsection": "list"}', 'section: databaseview, subsection: list, workspace: e9accd3f'),
	('ed7bc9d5-d3ea-4888-9439-b99b8cf26ea5', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/superset/sqllab', NULL, 'allow', '{"section": "superset", "workspace": "e9accd3f", "subsection": "sqllab"}', 'section: superset, subsection: sqllab, workspace: e9accd3f'),
	('2e703898-324f-41e5-ae7a-e0c3e7cc5528', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/savedqueryview/list/?filters=%5B%5D&pageIndex=0&sortColumn=changed_on_delta_humanized&sortOrder=desc', NULL, 'allow', '{"section": "savedqueryview", "workspace": "e9accd3f", "subsection": "list"}', 'section: savedqueryview, subsection: list, workspace: e9accd3f'),
	('0a3caeed-28d8-4e68-a7dc-869c87a4209f', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/superset/sqllab#search', NULL, 'allow', '{"section": "superset", "workspace": "e9accd3f", "subsection": "sqllab"}', 'section: superset, subsection: sqllab, workspace: e9accd3f'),
	('0cc85a06-23f0-4707-b924-13b0f2b880c3', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/dashboard/list/?filters=%5B%5D&pageIndex=0&sortColumn=changed_on_delta_humanized&sortOrder=desc', NULL, 'allow', '{"section": "dashboard", "workspace": "e9accd3f", "subsection": "list"}', 'section: dashboard, subsection: list, workspace: e9accd3f'),
	('95a4f6e0-95c0-43e6-a696-c7d04a994336', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/superset/dashboard/deck/', NULL, 'allow', '{"section": "superset", "workspace": "e9accd3f", "subsection": "dashboard", "dashboardName": "deck"}', 'dashboardName: deck, section: superset, subsection: dashboard, workspace: e9accd3f'),
	('91e2972b-0c6c-4357-9f3c-8a112481470e', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'https://e9accd3f.app.preset.io/superset/dashboard/7/', NULL, 'allow', '{"section": "superset", "workspace": "e9accd3f", "subsection": "dashboard", "dashboardName": "7"}', 'dashboardName: 7, section: superset, subsection: dashboard, workspace: e9accd3f'),
	('170ef1a2-e6ab-4769-afd2-6672c3ce331e', 'b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'https://relate.app/nimrodpriell/starter', NULL, 'allow', '{"id": "nimrodpriell", "project": "starter"}', 'id: nimrodpriell, project: starter'),
	('901aec92-241d-486a-8c6a-35f15bbe36b3', 'b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'https://relate.app/nimrodpriell', NULL, 'allow', '{"id": "nimrodpriell"}', 'id: nimrodpriell'),
	('56668f1d-2481-4f7c-8e94-d914fbd7735e', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/apps/Radical%20Onboarding', NULL, 'allow', '{"app": "Radical%20Onboarding", "section": "apps", "workspace": "radicalhq"}', 'app: Radical%20Onboarding, section: apps, workspace: radicalhq'),
	('c45ca8fb-823a-43fe-81e6-2af002fad1ba', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/editor/Radical%20Onboarding', NULL, 'allow', '{"app": "Radical%20Onboarding", "section": "editor", "workspace": "radicalhq"}', 'app: Radical%20Onboarding, section: editor, workspace: radicalhq'),
	('f97298af-b6bf-463a-b174-4a8d4b99a994', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/', NULL, 'allow', '{"workspace": "radicalhq"}', 'workspace: radicalhq'),
	('bdf8236b-fd5d-4f36-a358-6999aee5670d', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/flows/31', NULL, 'allow', '{"app": "31", "section": "flows", "workspace": "radicalhq"}', 'app: 31, section: flows, workspace: radicalhq'),
	('74d32fdf-ec00-4fc8-873d-de8db17d318e', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/resources/onboarding_db%20(readonly)', NULL, 'allow', '{"app": "onboarding_db%20(readonly)", "section": "resources", "workspace": "radicalhq"}', 'app: onboarding_db%20(readonly), section: resources, workspace: radicalhq'),
	('a3db0932-b8e1-4360-b75c-748f10d1eea8', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/folders/archive', NULL, 'allow', '{"app": "archive", "section": "folders", "workspace": "radicalhq"}', 'app: archive, section: folders, workspace: radicalhq'),
	('f9073993-20fe-4d5f-822b-8dcfb1df0ffb', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/querylibrary/25034/Untitled', NULL, 'allow', '{"name": "Untitled", "queryid": "25034", "section": "querylibrary", "workspace": "radicalhq"}', 'name: Untitled, queryid: 25034, section: querylibrary, workspace: radicalhq'),
	('50d781ea-403f-4676-9274-2ddf63709cfe', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.retool.com/views/all', NULL, 'allow', '{"app": "all", "section": "views", "workspace": "radicalhq"}', 'app: all, section: views, workspace: radicalhq'),
	('8179dd14-fe35-43fb-853f-feaa6ef3a175', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.tryretool.com/apps/Radical%20Onboarding', NULL, 'allow', '{"app": "Radical%20Onboarding", "section": "apps", "workspace": "radicalhq"}', 'app: Radical%20Onboarding, section: apps, workspace: radicalhq'),
	('184a6052-f97f-4e13-ac99-fd46b3c7d2a3', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'https://radicalhq.tryretool.com/editor/Radical%20Onboarding', NULL, 'allow', '{"app": "Radical%20Onboarding", "section": "editor", "workspace": "radicalhq"}', 'app: Radical%20Onboarding, section: editor, workspace: radicalhq'),
	('b5f91e06-19f5-4357-8ccb-b399eacfc5ea', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'https://cord.sanity.studio/desk/home', NULL, 'allow', '{"project": "cord", "section": "desk", "subsection": "home"}', 'project: cord, section: desk, subsection: home'),
	('d2aa4811-7931-43ab-8e32-4688c7a17cd3', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'https://cord.sanity.studio/desk/post;6c6-7bbf-c7f33', NULL, 'allow', '{"pageId": "6c6-7bbf-c7f33", "project": "cord", "section": "desk", "subsection": "post"}', 'pageId: 6c6-7bbf-c7f33, project: cord, section: desk, subsection: post'),
	('c2515f87-0865-4b0f-8c55-2c0acc3f52f7', 'd19d7a6f-8fce-453a-8619-90d9c6d8c199', 'https://slack-files.com/files-pri-safe/T012Y0TBQLW-F01F0E800CB/radical_-_communicate_in_context.pdf?c=1605698307-fa736d1a5cc52b40', NULL, 'allow', '{"file": "F01F0E800CB", "team": "T012Y0TBQLW", "filename": "radical_-_communicate_in_context.pdf"}', 'radical_-_communicate_in_context.pdf'),
	('e4a1435f-ad49-4fe0-90b6-282fc619ee76', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'https://app.smartsheet.com/resourceviews', NULL, 'allow', '{"section": "resourceviews"}', 'section: resourceviews'),
	('8d7f04d7-4a78-4285-b5b6-c6a674be5cb7', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'https://app.smartsheet.com/sheets/hGvFGXjGXPc?view=card&cardLevel=0&cardViewByColumnId=7315', NULL, 'allow', '{"itemId": "hGvFGXjGXPc", "section": "sheets"}', 'itemId: hGvFGXjGXPc, section: sheets'),
	('e15f735e-3f46-4b03-a816-f626ec15156d', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'https://app.smartsheet.com/folders/9c7HxWX2q2', NULL, 'allow', '{"itemId": "9c7HxWX2q2", "section": "folders"}', 'itemId: 9c7HxWX2q2, section: folders'),
	('fd83e4cb-69e5-4566-a5f4-3dc406a0c46c', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'https://app.smartsheet.com/folders/personal', NULL, 'deny', NULL, NULL),
	('53002e15-1162-41c5-8a38-2e80a0cf03e6', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console#/internal/worksheet', NULL, 'allow', '{"site": "eo32667.us-east-2.aws", "section": "internal", "subsection": "worksheet"}', 'section: internal, site: eo32667.us-east-2.aws, subsection: worksheet'),
	('50d33e61-8e23-4730-941c-65933687b9bb', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console#/monitoring/queries/detail?queryId=019df-00', NULL, 'allow', '{"page": "detail", "site": "eo32667.us-east-2.aws", "queryId": "019df-00", "section": "monitoring", "subsection": "queries"}', 'page: detail, queryId: 019df-00, section: monitoring, site: eo32667.us-east-2.aws, subsection: queries'),
	('bd9f6a14-bd09-4304-b27d-f5f56a6fbd28', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console#/data/sequences?databaseName=DEMO_DB', NULL, 'allow', '{"site": "eo32667.us-east-2.aws", "section": "data", "subsection": "sequences", "databaseName": "DEMO_DB"}', 'databaseName: DEMO_DB, section: data, site: eo32667.us-east-2.aws, subsection: sequences'),
	('3bab0424-8a14-4187-a9cd-71f7897ea389', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console#/warehouse/monitoring?warehouseName=COMPUTE_WH', NULL, 'allow', '{"site": "eo32667.us-east-2.aws", "section": "warehouse", "subsection": "monitoring", "warehouseName": "COMPUTE_WH"}', 'section: warehouse, site: eo32667.us-east-2.aws, subsection: monitoring, warehouseName: COMPUTE_WH'),
	('a9700d43-a083-42e2-aef3-a1e8af8ee0d8', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console/#/monitoring/queries/detail?queryId=019df-00', NULL, 'allow', '{"page": "detail", "site": "eo32667.us-east-2.aws", "queryId": "019df-00", "section": "monitoring", "subsection": "queries"}', 'page: detail, queryId: 019df-00, section: monitoring, site: eo32667.us-east-2.aws, subsection: queries'),
	('06d43487-838b-49f3-86f0-0db1cc1940dc', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console#monitoring/queries/detail?queryId=019df-00', NULL, 'allow', '{"page": "detail", "site": "eo32667.us-east-2.aws", "queryId": "019df-00", "section": "monitoring", "subsection": "queries"}', 'page: detail, queryId: 019df-00, section: monitoring, site: eo32667.us-east-2.aws, subsection: queries'),
	('28cd0b32-995d-40c7-97a1-cf8b7a47f9a9', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'https://eo32667.us-east-2.aws.snowflakecomputing.com/console/#monitoring/queries/detail?queryId=019df-00', NULL, 'allow', '{"page": "detail", "site": "eo32667.us-east-2.aws", "queryId": "019df-00", "section": "monitoring", "subsection": "queries"}', 'page: detail, queryId: 019df-00, section: monitoring, site: eo32667.us-east-2.aws, subsection: queries'),
	('9f0e2632-c441-4668-8e10-8beacf8b9cab', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'https://app.snyk.io/org/nimster/project/5728-9e8b-4f/', NULL, 'allow', '{"org": "nimster", "section": "project", "projectId": "5728-9e8b-4f"}', 'org: nimster, projectId: 5728-9e8b-4f, section: project'),
	('15b92ea9-6fb1-4794-8c40-13678d685b3e', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'https://app.snyk.io/org/nimster/', NULL, 'allow', '{"org": "nimster"}', 'org: nimster'),
	('7769dd24-87e5-442f-9ce7-59abd6c7faef', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'https://app.snyk.io/org/nimster/project/5728-9e8b-4f/settings', NULL, 'allow', '{"org": "nimster", "section": "project", "projectId": "5728-9e8b-4f", "subsection": "settings"}', 'org: nimster, projectId: 5728-9e8b-4f, section: project, subsection: settings'),
	('cccb8b97-f601-43d9-accc-f48ecc7084f8', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'https://app.snyk.io/vuln/SNYK-DEBIAN9-GLIBC-356506', NULL, 'allow', '{"vuln": "SNYK-DEBIAN9-GLIBC-356506", "section": "vuln"}', 'section: vuln, vuln: SNYK-DEBIAN9-GLIBC-356506'),
	('cc4d48a9-9ff8-4ffe-8bf7-d94e854675ee', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'https://app.snyk.io/org/nimster/reports', NULL, 'allow', '{"org": "nimster", "section": "reports"}', 'org: nimster, section: reports'),
	('c7977598-4ba0-4969-83bc-4568faf1c2f7', 'e54ae87a-741e-4f45-a5c0-6e28647b3d90', 'https://storage.googleapis.com/documents.prod.netpurpose.com/24da2003b79f042112144d2fb5a019cb.pdf', NULL, 'allow', '{"bucket": "documents.prod.netpurpose.com", "filename": "24da2003b79f042112144d2fb5a019cb.pdf"}', '24da2003b79f042112144d2fb5a019cb.pdf'),
	('e2b8031a-4b88-4227-b24e-4132b901a717', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'https://dub01.online.tableau.com/t/cord/authoring/EmailPerf/EmailPerf#1', NULL, 'allow', '{"name": "EmailPerf", "name2": "EmailPerf", "space": "cord", "section": "authoring"}', 'name: EmailPerf, name2: EmailPerf, section: authoring, space: cord'),
	('b8d4a8f5-d886-4919-b8f5-ce8bb98706a8', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'https://dub01.online.tableau.com/t/cord/authoring/EmailPerf/EmailPerf/Sheet%205#1', NULL, 'allow', '{"name": "EmailPerf", "name2": "EmailPerf", "sheet": "Sheet%205", "space": "cord", "section": "authoring"}', 'name: EmailPerf, name2: EmailPerf, section: authoring, sheet: Sheet%205, space: cord'),
	('7366a440-44f0-46a3-ba95-fb4c323f5512', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'https://10ay.online.tableau.com/#/site/carwowtest/views/PerfoshboardsDoC/MainDOC/ro.ra@carwow.co.uk/allenquiries60dUK?:iid=1', NULL, 'allow', '{"tab": "allenquiries60dUK", "name": "PerfoshboardsDoC", "sheet": "MainDOC", "space": "carwowtest", "section": "site", "subsection": "views"}', 'name: PerfoshboardsDoC, section: site, sheet: MainDOC, space: carwowtest, subsection: views, tab: allenquiries60dUK'),
	('433a357f-dd7f-440f-a8b6-c6218d290f11', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'https://dub01.online.tableau.com/#/site/cordtest/views/AccountTracking/AccountTracking?:iid=2', NULL, 'allow', '{"name": "AccountTracking", "sheet": "AccountTracking", "space": "cordtest", "section": "site", "subsection": "views"}', 'name: AccountTracking, section: site, sheet: AccountTracking, space: cordtest, subsection: views'),
	('807fa531-ae37-4580-a808-ab5011be050b', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'https://dub01.online.tableau.com/#/site/cord/home', NULL, 'allow', '{"space": "cord", "section": "site", "subsection": "home"}', 'section: site, space: cord, subsection: home'),
	('3503217b-c328-4a2e-9763-f06f6144ce66', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/reports/127281', NULL, 'allow', '{"account": "radicalhq", "section": "reports", "objectId": "127281"}', 'account: radicalhq, objectId: 127281, section: reports');
INSERT INTO cord.provider_rule_tests VALUES
	('f97c12c9-3adc-431d-b899-b1ad35565aed', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/successbloc/60198/segments/folder/0', NULL, 'allow', '{"itemId": "0", "account": "radicalhq", "section": "successbloc", "itemType": "folder", "objectId": "60198", "subsection": "segments"}', 'account: radicalhq, itemId: 0, itemType: folder, objectId: 60198, section: successbloc, subsection: segments'),
	('e4cbc69b-49b9-45a6-9eaf-07b44b2e63a6', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/accounts/10491/plan', NULL, 'allow', '{"account": "radicalhq", "section": "accounts", "objectId": "10491", "subsection": "plan"}', 'account: radicalhq, objectId: 10491, section: accounts, subsection: plan'),
	('53030a16-7a01-473e-94db-c26fb389a904', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/accounts/10491', NULL, 'allow', '{"account": "radicalhq", "section": "accounts", "objectId": "10491"}', 'account: radicalhq, objectId: 10491, section: accounts'),
	('332d4ce1-1107-45d7-bf58-e1491b16dfb3', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/impact-segment/account/780470/list', NULL, 'allow', '{"page": "list", "account": "radicalhq", "section": "impact-segment", "objectId": "780470", "subsection": "account"}', 'account: radicalhq, objectId: 780470, page: list, section: impact-segment, subsection: account'),
	('54c52978-fe46-44f5-9c28-331765731a93', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/successplays/9175-845d-61', NULL, 'allow', '{"account": "radicalhq", "section": "successplays", "objectId": "9175-845d-61"}', 'account: radicalhq, objectId: 9175-845d-61, section: successplays'),
	('87114f24-c010-4ca0-9b4c-19fa65c8f9ac', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'https://app.totango.com/t01/radicalhq/#/settings/integrations/hub/applications', NULL, 'allow', '{"account": "radicalhq", "section": "settings", "subsection": "integrations", "subsection2": "hub", "subsection3": "applications"}', 'account: radicalhq, section: settings, subsection: integrations, subsection2: hub, subsection3: applications'),
	('d305869d-118b-43a8-9c13-3868dae05250', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/form/dAnsOjt5/results#responses', NULL, 'allow', '{"tab": "responses", "formId": "dAnsOjt5", "subsection": "results"}', 'formId: dAnsOjt5, subsection: results, tab: responses'),
	('8301c36d-dd5d-4b3b-bc80-813e3a80faf9', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/form/dAnsOjt5/results#insights', NULL, 'allow', '{"tab": "insights", "formId": "dAnsOjt5", "subsection": "results"}', 'formId: dAnsOjt5, subsection: results, tab: insights'),
	('71f0f817-e965-4c2e-889b-debd28cef0b1', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/form/dAnsOjt5/share#/', NULL, 'allow', '{"formId": "dAnsOjt5", "subsection": "share"}', 'formId: dAnsOjt5, subsection: share'),
	('987f8617-3a00-4721-ba92-467c8639a8bf', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/form/dAnsOjt5/connect#/section/integrations', NULL, 'allow', '{"formId": "dAnsOjt5", "subsection": "connect"}', 'formId: dAnsOjt5, subsection: connect'),
	('fa1c3e0f-5b8f-4570-b78c-25783bc6d22c', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/form/dAnsOjt5/create', NULL, 'allow', '{"formId": "dAnsOjt5", "subsection": "create"}', 'formId: dAnsOjt5, subsection: create'),
	('e71a1bfe-0561-4f02-aae7-070fcc96d9da', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'https://admin.typeform.com/accounts/01EB/workspaces/fEsuk9', NULL, 'allow', '{"accountId": "01EB", "subsection": "workspaces", "workspaceId": "fEsuk9"}', 'accountId: 01EB, subsection: workspaces, workspaceId: fEsuk9'),
	('071bf887-af05-470f-8cf4-9cbb566c7625', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'https://cord-staging.vercel.app/', NULL, 'allow', '{"project": "cord-staging"}', 'project: cord-staging'),
	('763516c5-45e8-461b-86df-51fd8de7e36c', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'https://cord-staging.vercel.app/desk', NULL, 'allow', '{"project": "cord-staging", "section": "desk"}', 'project: cord-staging, section: desk'),
	('a4056bba-0521-476f-9dd6-bfdf81fada32', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'https://cord.vercel.app/about/post/6c6-7bbf-c7f33', NULL, 'allow', '{"project": "cord", "section": "about"}', 'project: cord, section: about'),
	('16c98e7f-f2b9-4aea-bbc7-0e1c6ca6dc45', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'https://webflow.com/design/getradical?pageId=5e1117', NULL, 'allow', '{"pageId": "5e1117", "sitename": "getradical"}', 'pageId: 5e1117, sitename: getradical'),
	('9371c41b-ef9a-47e4-a17a-e1b5c32be26c', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'https://webflow.com/dashboard/sites/getradical/billing?sp=project%20editor%20tab', NULL, 'allow', '{"section": "billing", "sitename": "getradical"}', 'section: billing, sitename: getradical');
INSERT INTO cord.provider_rules VALUES
	('8e1b6ef7-6db7-45fe-8e32-d127ce60d575', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'deny', 0, '{"path": "/about-us/", "domain": "cord.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('98d49c28-8c24-42fa-8fa2-9a8d8e925799', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'allow', 1, '{"hash": ":section", "path": "/", "domain": "cord.com"}', false, 'Cord: {{context.section}}', '{"data": null, "type": "default"}'),
	('fa3fc8d1-7c3d-4446-855e-4ac625d27ded', 'fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'allow', 2, '{"path": "/:page", "domain": "cord.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('cdbedd64-418d-4a3a-aeaf-7b0775e64386', '4999a984-16a0-4c20-901c-a31aaf41ab2a', 'allow', 0, '{"path": "/:workspace", "domain": "app.cord.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('a6ae97f8-b805-4878-917b-519ffa716ce8', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 0, '{"hash": ":page", "path": "/:section/*.php", "domain": "(:project.)activehosted.com", "queryParams": {"action": ":action"}}', false, NULL, '{"data": null, "type": "default"}'),
	('6da455c7-0cfe-4b19-90aa-3a3baa998caf', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 1, '{"path": "/:section/:subsection/", "domain": "(:project.)activehosted.com", "queryParams": {"listid": ":listid"}}', false, NULL, '{"data": null, "type": "default"}'),
	('b4b09d70-0888-4784-bda6-2817b84de62a', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 2, '{"path": "/:section/*.php", "domain": "(:project.)activehosted.com", "queryParams": {"id": ":id", "action": ":action"}}', false, NULL, '{"data": null, "type": "default"}'),
	('26e201ea-1033-4a72-af7c-953969c85d33', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 3, '{"path": "/:section/*.php", "domain": "(:project.)activehosted.com", "queryParams": {"action": ":action"}}', false, NULL, '{"data": null, "type": "default"}'),
	('17e777c4-a106-4f81-8f8a-90f59d8a9966', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 4, '{"path": "/:section/:subsection/", "domain": "(:project.)activehosted.com", "queryParams": {"seriesid": ":seriesid"}}', false, NULL, '{"data": null, "type": "default"}'),
	('d214e118-978b-49f9-9b1c-276462b9739e', 'b9069b43-ef16-4f53-b47c-9ab8e4639095', 'allow', 5, '{"path": "/:section/:id(/:subsection)", "domain": "(:project.)activehosted.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('02983761-2c9f-42a5-b07a-8f3fe877b34f', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 0, '{"path": "D:diff", "domain": "radical.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('0e10183c-0552-49fc-a94d-369ad5cb5c21', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 1, '{"path": "T:task", "domain": "radical.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('0915e301-1b39-46a9-a6ce-ded237c23afb', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 2, '{"path": "*", "domain": "radical.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"pathname": "{{#if url.pathname}}{{url.pathname}}{{/if}}"}, "type": "replace"}'),
	('f0c0091b-8e89-4ca6-bf47-4325cd8ad727', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 3, '{"path": "D:diff", "domain": ":domain.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('7f1681aa-7944-43d3-a472-1b5893506d50', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 4, '{"path": "T:task", "domain": ":domain.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('ed2da976-2eba-4b60-9c26-4e54f4d63afd', 'f2851b03-e0d8-416c-9787-22270a3ff9a5', 'allow', 5, '{"path": "*", "domain": ":domain.phacility.com"}', false, '
    {{#if title}}
      {{#regexReplace "^\\([0-9]+\\)" ""}}{{title}}{{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"pathname": "{{#if url.pathname}}{{url.pathname}}{{/if}}"}, "type": "extend"}'),
	('bd743a8c-8131-4b09-9783-9be67cbe9716', 'f15a72de-75e6-4595-af36-fb6ac748e6b8', 'allow', 0, '{"hash": ":section", "path": "/", "domain": "(mc.)sendgrid.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('4de54daf-cf60-47b0-a1e0-6c7bd1a4d8f9', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'allow', 0, '{"path": ":section", "queryParams": {"id": ":id", "tab": ":tab", "name": ":name", "subtab": ":subtab", "version": ":version"}}', false, NULL, '{"data": null, "type": "default"}'),
	('022989b9-f0c6-4711-b915-819507a097c0', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'allow', 1, '{"path": ":section", "queryParams": {"id": ":id", "tab": ":tab", "name": ":name", "version": ":version"}}', false, NULL, '{"data": null, "type": "default"}'),
	('4efc604d-d8ea-4b0b-af39-1bb82811c338', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'allow', 2, '{"path": ":section", "queryParams": {"id": ":id", "tab": ":tab", "name": ":name"}}', false, NULL, '{"data": null, "type": "default"}'),
	('d2d59793-8591-49b6-baee-6fcb8e643ec1', '5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'allow', 3, '{"path": "/(:name(/*))", "domain": ":id.bubbleapps.io"}', false, NULL, '{"data": null, "type": "default"}'),
	('5047009a-ba09-4ae4-8a10-e7bbe5276773', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 0, '{"path": "/:section", "queryParams": {"sub": ":sub", "tab": ":tab"}}', false, NULL, '{"data": null, "type": "default"}'),
	('86cf037a-455c-490e-aea6-b6a75815d2f8', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 1, '{"path": "/:section", "queryParams": {"tab": ":tab"}}', false, NULL, '{"data": null, "type": "default"}'),
	('aff75abf-b54c-434e-b09d-8c37d535ba34', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 2, '{"path": "/:section", "queryParams": {"project": ":project"}}', false, NULL, '{"data": null, "type": "default"}'),
	('790fedfe-2fea-46ae-8b0b-92d4cf761171', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 3, '{"path": "/:section/:project", "queryParams": {"tab": ":tab"}}', false, NULL, '{"data": null, "type": "default"}'),
	('d9d64d80-d72f-4945-abe5-2867233cc429', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 4, '{"path": "/:section/:project"}', false, NULL, '{"data": null, "type": "default"}'),
	('70d15ce7-068a-46ae-a31b-4cb2a621a7b9', '1559e0ce-b6d0-4b10-96d4-0779e128908c', 'allow', 5, '{"path": "/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('80f81f36-9cdd-4811-a12d-976b354e6f98', 'b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'allow', 0, '{"path": "/:id(/:project)"}', false, NULL, '{"data": null, "type": "default"}'),
	('035cc88d-103f-4139-90a7-86c62b6799d7', '9102c8b1-b4a7-4dda-9db1-888e6266230f', 'allow', 0, '{"path": "/:section/:project(/:page)"}', false, NULL, '{"data": null, "type": "default"}'),
	('6af50fb9-be3b-480e-a6c3-acb336f94746', '74987f27-86b4-4c18-8387-eed009535254', 'allow', 0, '{"path": "/:section/:subsection(/:action)"}', false, NULL, '{"data": null, "type": "default"}'),
	('a04d56bf-623b-4786-b6de-9f4a8ea29903', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'allow', 0, '{"hash": "/:account/b/*/:section(/:objectId)", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('8b6d8a86-111b-40a7-87ca-f3a5850ca2ae', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'allow', 1, '{"hash": "/:account/e/*/:section(/:objectId)", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('1bde3ba6-e804-4207-9cd5-8d2c900e7cad', '433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'allow', 2, '{"hash": "/:account/:section(/:objectId)", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('1597945a-c144-4354-bc74-fca9eff91363', 'aba3c96f-822d-4555-81ef-fe0a39951a1a', 'allow', 0, '{"hash": "/accounts/:accountId/projects/:projectId/:section(/:objectId(/:subsection))/", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('d5058d33-b664-410a-a3c9-7451f1d33765', '3e275414-4e34-4672-9f30-cfa822300e7a', 'allow', 0, '{"hash": "/report-home/:reportId", "path": "/analytics/web/", "domain": "analytics.google.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('3092d2b4-9424-4cb6-b082-cabae312371b', '3e275414-4e34-4672-9f30-cfa822300e7a', 'allow', 1, '{"hash": "/:section/:subsection/:reportId(/*)", "path": "/analytics/web/", "domain": "analytics.google.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('2463c065-2f03-4bed-9bbd-95a416626bfb', 'b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'allow', 0, '{"path": "/u/*/:section/:longId/page/:shortId(/*)", "domain": "datastudio.google.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('6c1e0c64-ca57-4d31-beb4-3f6d0ced881d', 'b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'allow', 1, '{"path": "/u/*/:section/:longId(/*)", "domain": "datastudio.google.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('cb127b21-2ab2-4165-abd9-a57e4d821047', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'allow', 2, '{"path": "/:section/:app", "domain": ":workspace.*.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('4ccdee19-9118-486d-b6cc-95054f6977fc', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 0, '{"path": "/aw/express/:section", "domain": "ads.google.com", "queryParams": {"edit": ":edit", "campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('37df822b-ceae-4c70-b632-6c59fdcef838', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 1, '{"path": "/aw/express/:section", "domain": "ads.google.com", "queryParams": {"campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('3520fd9c-317f-4b43-9903-3951286d5d04', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 2, '{"path": "/aw/:section/:subsection", "domain": "ads.google.com", "queryParams": {"adGroupId": ":adGroupId", "campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('fcba2d87-cf66-4577-9fcd-78dbf9f33416', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 3, '{"path": "/aw/:section/:subsection", "domain": "ads.google.com", "queryParams": {"campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('9cf5b23f-c7a5-4511-b276-9eb29fe0d78f', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 4, '{"path": "/aw/:section", "domain": "ads.google.com", "queryParams": {"adGroupId": ":adGroupId", "campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('b3e07488-6bf7-42c9-8eaf-392134d571fc', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 5, '{"path": "/aw/:section", "domain": "ads.google.com", "queryParams": {"campaignId": ":campaignId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('ed19fdf0-3c69-4987-97f7-13b109c6971d', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 6, '{"path": "/aw/:section/:subsection", "domain": "ads.google.com", "queryParams": {"channel": ":channel"}}', false, NULL, '{"data": null, "type": "default"}'),
	('59a57657-f3a7-4fa8-b9bb-18853df44644', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 7, '{"path": "/aw/:section", "domain": "ads.google.com", "queryParams": {"channel": ":channel"}}', false, NULL, '{"data": null, "type": "default"}'),
	('8c2310c6-acd0-4cab-a6b4-e97d32fafbc8', 'a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'allow', 8, '{"path": "/aw/:section", "domain": "ads.google.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('b1f35ec9-e58a-4dc6-b8f8-12f171996982', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 0, '{"path": "/:section", "domain": "console.cloud.google.com", "queryParams": {"d": ":dataset", "p": ":resource", "t": ":table", "page": "table", "project": ":project"}}', false, NULL, '{"data": {"page": "table"}, "type": "extend"}'),
	('55528778-7362-426d-9780-6e2fb7e0aed3', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 1, '{"path": "/:section", "domain": "console.cloud.google.com", "queryParams": {"j": ":jobId", "page": "queryresults", "project": ":project"}}', false, NULL, '{"data": {"page": "queryresults"}, "type": "extend"}'),
	('2cefe1b5-3c79-4ae0-b6cb-833bdea3d412', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 2, '{"path": "/:section", "domain": "console.cloud.google.com", "queryParams": {"sq": ":savedqueryId", "page": "savedqueries", "project": ":project"}}', false, NULL, '{"data": {"page": "savedqueries"}, "type": "extend"}'),
	('2d5a9f70-7b19-4c6b-a84a-dcb6b28dc305', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 3, '{"path": "/:section", "domain": "console.cloud.google.com", "queryParams": {"page": ":page", "project": ":project"}}', false, NULL, '{"data": null, "type": "default"}'),
	('529adb45-ac2d-4787-b212-205e4575e09b', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 4, '{"path": "/:section/:subsection", "domain": "console.cloud.google.com", "queryParams": {"project": ":project"}}', false, NULL, '{"data": null, "type": "default"}'),
	('ecb979e4-ee05-408b-9945-63687d241dd2', '64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'allow', 5, '{"path": "/:section", "domain": "console.cloud.google.com", "queryParams": {"project": ":project"}}', false, NULL, '{"data": null, "type": "default"}'),
	('caaf8caf-79b1-418b-b39e-9b73f1548eac', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 0, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"accountID": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('6ff2f041-8551-464a-b395-0a4b8b934e83', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 1, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"bankAccountID": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('a90d12b7-df85-4eea-ab0e-cb6c5974fc2a', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 2, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"creditNoteID": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('04f78548-61c9-4e27-9a93-4e4eeba6cd4d', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 3, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"reportId": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('6894e7a5-c094-4995-9e48-07a7a9920650', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 4, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"InvoiceID": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('5aea3463-c005-4a59-80d5-99bb15abca25', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 5, '{"path": "/:id/v2/:subsection/", "domain": "reporting.xero.com"}', false, NULL, '{"data": {"section": "cashflow"}, "type": "extend"}'),
	('ba7841d4-6448-4446-b4f7-7b36946fe5be', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 6, '{"path": "/:id/v1/Run/:run", "domain": "reporting.xero.com"}', false, NULL, '{"data": {"section": "reporting"}, "type": "extend"}'),
	('12f32e1c-d295-4330-b9e0-42c8f05dd6ba', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 7, '{"path": "/cashflow/:id(/*)", "domain": "go.xero.com"}', false, NULL, '{"data": {"section": "cashflow"}, "type": "extend"}'),
	('65394a75-654a-4cec-bff5-97c45c03a468', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 8, '{"path": "/:section/:subsection", "domain": "go.xero.com", "queryParams": {"invoiceStatus": ":tab"}}', false, NULL, '{"data": {"tab": "{{decodeURI tab}}"}, "type": "extend"}'),
	('8e072e8e-a2e4-4124-af80-0c264201c1d2', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 9, '{"path": "/:section/:subsection/", "domain": "go.xero.com", "queryParams": {"contactType": ":tab"}}', false, NULL, '{"data": {"tab": "{{decodeURI tab}}"}, "type": "extend"}'),
	('96b40c2d-f967-47d7-9fec-5afbb65b4d06', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 10, '{"path": "/:section/:subsection/:id", "domain": "go.xero.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('08b5152e-fb18-49a3-9b9a-551b03840cea', '42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'allow', 11, '{"path": "/:section/:subsection", "domain": "go.xero.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('b2acc5ba-08b8-4ffb-8ed6-2aa41a776bc5', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'allow', 0, '{"path": "/app/:section(/:subsection)", "queryParams": {"id": ":objectId", "view": ":page"}}', false, NULL, '{"data": null, "type": "default"}'),
	('573c4a59-b313-4471-8ad5-7bed907eacb8', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'allow', 1, '{"path": "/app/:section(/:subsection)", "queryParams": {"view": ":page"}}', false, NULL, '{"data": null, "type": "default"}'),
	('19a02e86-8b64-4b7b-9689-a336fce6c2d9', 'cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'allow', 2, '{"path": "/app/:section(/:subsection)"}', false, NULL, '{"data": null, "type": "default"}'),
	('6962a845-474d-47c0-977d-1e89b2a435cb', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'allow', 0, '{"path": "/design/:sitename", "domain": "webflow.com", "queryParams": {"pageId": ":pageId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('e4db3115-8c5d-442d-a0ec-16fdf49d70fe', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'allow', 1, '{"path": "/design/:sitename", "domain": "webflow.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('8cd40284-deb0-4b00-9dcc-b3129fdc51c1', '90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'allow', 2, '{"path": "/dashboard/sites/:sitename/:section", "domain": "webflow.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('68bc2f1a-f3be-4899-926f-60ddb961f553', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'deny', 0, '{"path": "/me/*", "domain": "(www.)medium.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('3fc3f13f-c12b-41c3-8aef-8439cf8c2895', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'allow', 1, '{"path": "/:section/:page", "domain": "(www.)medium.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('3a06d81f-b49e-47c4-9219-9a70ea18b476', '1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'allow', 2, '{"path": "/:page", "domain": ":section.medium.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('1fea529d-2458-44aa-a8a6-f61781bbaade', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'deny', 0, '{"domain": "(www.)(try)retool.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('bbae1743-3275-4bc3-a28c-264efd60b025', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'allow', 1, '{"path": "/querylibrary/:queryid/:name", "domain": ":workspace.*.com"}', false, NULL, '{"data": {"section": "querylibrary"}, "type": "extend"}'),
	('9d53da3d-ad73-4cff-9f16-888089b617f7', '707d5823-6492-46ee-83b2-fb9f0a4fa506', 'allow', 3, '{"domain": ":workspace.*.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('6e9b59ae-c8d1-40e6-9be0-659e69c13b9a', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'allow', 0, '{"path": "/:section/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('24a9cf97-d40b-4d00-a156-1757d1f4802a', '37d6bd3a-c812-4875-ab11-95003c8118bb', 'allow', 1, '{"path": "/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('a2af79f0-b089-4160-964e-6dfd8db6409d', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'allow', 0, '{"path": "/:section(/:subsection(/:action))", "queryParams": {"id": ":id"}}', false, NULL, '{"data": null, "type": "default"}'),
	('c81dc76e-0bef-43f7-899b-4b806f6c4f30', '07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'allow', 1, '{"path": "/:section(/:subsection(/:action))"}', false, NULL, '{"data": null, "type": "default"}'),
	('e6b6cd59-fef1-4928-870c-83c7e007e8b4', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'allow', 0, '{"path": "/sites/:siteId/:section/:subsection/:reportId", "queryParams": {"type": ":type", "device": ":device"}}', false, NULL, '{"data": null, "type": "default"}'),
	('9a12e8f2-3263-49e2-87e8-5fee8abe252d', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'allow', 1, '{"path": "/sites/:siteId/:section/:subsection", "queryParams": {"segment": ":segmentId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('5bb3fbc5-70c7-4a50-91a8-d644d0b2e69a', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'allow', 2, '{"path": "/sites/:siteId/:section/:subsection"}', false, NULL, '{"data": null, "type": "default"}'),
	('5b1de044-4d23-47be-9368-a2c1d3bbd8ae', '936f7a62-4bee-4440-a5dc-d44a4de5b187', 'allow', 3, '{"path": "/r", "queryParams": {"site": ":siteId", "recording": ":recordingId"}}', false, NULL, '{"data": {"section": "recordings"}, "type": "extend"}'),
	('fb852e3a-c9d5-42a8-bc12-259c99454461', 'fc48f4d2-509a-4323-b49b-6365492bd93a', 'deny', 0, '{"path": "/checkout/payment"}', false, NULL, '{"data": null, "type": "default"}'),
	('354d2a28-42bb-4d9f-9a94-a03a68d8bb8d', 'fc48f4d2-509a-4323-b49b-6365492bd93a', 'allow', 1, '{"path": "/menu/:city/(*)/:slug"}', false, NULL, '{"data": null, "type": "default"}'),
	('7dece9ad-75b5-42b5-ba5e-a8f44686b403', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 0, '{"path": "/:product/software/projects/:project/:section/:board", "domain": ":space.atlassian.net", "queryParams": {"selectedIssue": ":issue"}}', false, NULL, '{"data": {"issue": "{{issue}}", "space": "{{space}}", "product": "{{product}}", "section": "issues"}, "type": "replace"}'),
	('af883779-3ebd-4e5d-9d62-472b2d67a8f8', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 1, '{"path": "/:product/software/projects/:project/:section/:board", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('c9468b2e-8056-4a44-a3b0-dc9d0172c92f', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 2, '{"path": "/browse/:issue", "domain": ":space.atlassian.net"}', false, NULL, '{"data": {"issue": "{{issue}}", "space": "{{space}}", "product": "jira", "section": "issues"}, "type": "replace"}'),
	('b79adead-4a08-453c-8770-373d8b953d6b', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 3, '{"path": "/:product/software/projects/:project/:section/:board/:subsection", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('f751e533-3566-4e9f-9a99-e1d59704be3a', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 4, '{"path": "/:product/software/projects/:project/:section", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('76317338-a7d7-4b50-9abd-cd85cc8b5573', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 5, '{"path": "/:product/spaces/:project/:section/:subsection-v2/:pageId", "domain": ":space.atlassian.net", "queryParams": {"draftShareId": ":draftId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('ab6f372a-5b8b-4b21-a9af-5da5e4de4f4b', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 6, '{"path": "/:product/spaces/:project/:section", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('647c0b03-662f-484a-9eae-96bf2f1609f6', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 7, '{"path": "/:product/spaces/:project/:section/:pageId/*", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('ab75cfb0-0ffb-4b56-abb1-6935aeab1638', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 8, '{"path": "/:product/:section.jspa", "domain": ":space.atlassian.net", "queryParams": {"selectPageId": ":dashboard"}}', false, NULL, '{"data": null, "type": "default"}'),
	('0f8c0cf4-b127-4777-8e38-39b7a344c438', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 9, '{"path": "/:product/people/:project/:teamId", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}'),
	('3cdae678-1fdc-4623-8c45-9179417844cc', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 10, '{"path": "/:product", "domain": ":space.atlassian.net", "queryParams": {"filter": ":filterId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('0dead487-c47c-4011-b3ad-9ac1e3776f31', '99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'allow', 11, '{"path": "/:product/:section.jspa", "domain": ":space.atlassian.net"}', false, NULL, '{"data": null, "type": "default"}');
INSERT INTO cord.provider_rules VALUES
	('eab64660-b41f-4729-b2bf-5771316b657d', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'allow', 0, '{"path": "/console/:section/:subsection/:page", "domain": "(:site).snowflakecomputing.com", "queryParams": {"queryId": ":queryId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('d0c4acf6-5a59-4d2a-9cb3-b80996a0b625', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'allow', 1, '{"path": "/console/:section/:subsection", "domain": "(:site).snowflakecomputing.com", "queryParams": {"databaseName": ":databaseName"}}', false, NULL, '{"data": null, "type": "default"}'),
	('dfa2c014-30f7-4890-a754-053ef02a4228', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'allow', 2, '{"path": "/console/:section/:subsection", "domain": "(:site).snowflakecomputing.com", "queryParams": {"warehouseName": ":warehouseName"}}', false, NULL, '{"data": null, "type": "default"}'),
	('06413547-aeb7-4145-9e83-7686f61d524b', 'bcf43368-40fa-4b26-b821-889a6a3d9d81', 'allow', 3, '{"path": "/console/:section/:subsection", "domain": "(:site).snowflakecomputing.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('96bd9e90-efcd-4277-822d-fe08f3c13fd9', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'allow', 0, '{"path": "/lightning/*/:objectId/related/:object/:action", "domain": "*.force.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('85d60fb4-10b2-4847-8626-d233b5c81353', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'allow', 1, '{"path": "/lightning/:object/:action", "domain": "*.force.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('da2f7e2b-e6cd-4524-a164-476fafafcf51', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'allow', 2, '{"path": "/lightning/*/:object/:objectId/:action", "domain": "*.force.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('e91fd2c7-88ea-4eab-8c64-1a8e106f1a1b', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'allow', 3, '{"path": "/lightning/*/:object/:action", "domain": "*.force.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('fcf1a0e1-ce07-4fc2-8be0-2488bed12b62', '1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'allow', 4, '{"path": "/_ui/*/:section/ui/:object", "domain": "*.salesforce.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('d5f1cfa4-d0ea-41b8-af20-5ab768e8d712', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 0, '{"hash": "/:section/:subsection", "path": "/:product/v2/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('5be9b705-455b-4f55-9a86-a56439ac0d3e', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 1, '{"hash": "/:section", "path": "/:product/v2/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('a7eb38c5-14df-49cd-aaee-e2919b809b70', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 2, '{"hash": "/:section/:subsection", "path": "/:product/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('bd9e8865-be4b-4e87-83d1-04da26f933eb', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 3, '{"hash": "/:section", "path": "/:product/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('5852cf5a-662e-4553-aa39-8a56ade5b9e0', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 4, '{"hash": "InstanceDetails*", "path": "/:product/v2/:page"}', false, NULL, '{"data": {"page": "{{page}}", "product": "{{product}}", "section": "InstanceDetails"}, "type": "replace"}'),
	('33bcb7a4-f708-4ca9-b4cf-9717848f711f', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 5, '{"hash": ":section\\\\:*Type=:resourceId", "path": "/:product/v2/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('b826baaa-d00a-4afe-9fea-72dd995a9b0d', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 6, '{"hash": ":section\\\\:*Id=:resourceId", "path": "/:product/v2/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('9a3fb5e2-c659-4579-8c70-cd3fd7723b6b', 'c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'allow', 7, '{"hash": ":section\\\\:*", "path": "/:product/v2/:page"}', false, NULL, '{"data": null, "type": "default"}'),
	('4586e911-2243-41c8-b5b0-effeb85aec96', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 0, '{"path": "/lists/*/:listId/*"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "lists"}, "type": "extend"}'),
	('b8573ea4-c88c-46a2-a4e5-68ce4d4216f8', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 1, '{"path": "/organization/:item/:subsection"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "organization"}, "type": "extend"}'),
	('ebcfb72d-1b5d-489e-9c4e-11f35f414182', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 2, '{"path": "/organization/:item"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "organization"}, "type": "extend"}'),
	('a864e449-0df1-446c-8da8-f51353e6a473', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 3, '{"path": "/discover/:item"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "discover"}, "type": "extend"}'),
	('24f2be36-3783-47f5-901d-dffe1ccb82fe', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 4, '{"path": "/hub/:item"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "hub"}, "type": "extend"}'),
	('48cd3a74-ca00-4615-b9e0-6140db5e2588', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 5, '{"path": "/lists/*/:listId/*"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "lists"}, "type": "extend"}'),
	('9e079acc-9cb5-4e43-ab72-f759790bdf19', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 6, '{"path": "/discover/saved/*/:itemId"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"item": "saved", "section": "discover"}, "type": "extend"}'),
	('d6889094-79bc-4c4f-b1c3-c2b92752487f', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 7, '{"path": "/discover/:item/:itemId"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "discover"}, "type": "extend"}'),
	('4e536ac7-01f8-4734-ba35-1bcccc149b8e', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 8, '{"path": "/searches"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "searches"}, "type": "replace"}'),
	('bdb70931-5850-45eb-991e-3e5b353bc086', '2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'allow', 9, '{"path": "/lists"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*Crunchbase\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": {"section": "lists"}, "type": "replace"}'),
	('23b30700-ab8e-4526-bd21-e9fa1f519247', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 0, '{"path": "/ads_manager/:accountId/:page/", "queryParams": {"editId": ":editId"}}', false, NULL, '{"data": {"product": "ads_manager"}, "type": "extend"}'),
	('22e28a67-4b84-46c1-8d30-3ad6884fa06d', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 1, '{"path": "/ads_manager/:accountId/:page/"}', false, NULL, '{"data": {"product": "ads_manager"}, "type": "extend"}'),
	('7cf543d1-4bc4-4857-a255-a471926713b4', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 2, '{"path": "/campaign/:accountId/:action/:objectType(/:objectId)/:section", "queryParams": {"editId": ":editId"}}', false, NULL, '{"data": {"product": "campaign"}, "type": "extend"}'),
	('ff1a0a5c-bf70-4516-8015-4d0233aadd5d', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 3, '{"path": "/campaign/:accountId/:action/:objectType(/:objectId)/:section", "queryParams": {"objective": ":objective"}}', false, NULL, '{"data": {"product": "campaign"}, "type": "extend"}'),
	('ccf41244-6187-447c-87e3-1236ef5390ff', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 4, '{"path": "/campaign/:accountId/:action/:objectType/:section"}', false, NULL, '{"data": {"product": "campaign"}, "type": "extend"}'),
	('0d0fe11a-abc3-4cc0-bb9d-26bbaf332b7f', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 5, '{"path": "/:product/:accountId/:section(/:subsection)", "queryParams": {"tweet_id": ":tweetId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('24f0930b-35ea-435b-aaf9-32008d1ec6e7', '9f83913b-9657-460e-b6ce-b3305f6acdae', 'allow', 6, '{"path": "/:product/:accountId/:section(/:subsection)*"}', false, NULL, '{"data": null, "type": "default"}'),
	('a3a6fd03-2f7c-4f77-ad57-13be17bad23c', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'deny', 0, '{"path": "/login"}', false, NULL, '{"data": null, "type": "default"}'),
	('ce679d2f-9da5-4242-9583-e159b72f4711', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'allow', 1, '{"path": "/:account/settings/:section(/:dashboard(/:subsection))", "queryParams": {"schema_id": ":schemaId"}}', false, NULL, '{"data": null, "type": "default"}'),
	('aee8baf7-b6d0-44fb-a67e-6637128e08d3', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'allow', 2, '{"path": "/:account/settings/:section(/:dashboard(/:subsection))"}', false, NULL, '{"data": null, "type": "default"}'),
	('de636a62-5f48-47de-9085-4704b381a791', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'allow', 3, '{"path": "/:account/:dashboard/:section/:itemId"}', false, NULL, '{"data": null, "type": "default"}'),
	('f7d26f87-ce38-47f0-a454-c38060fd5d11', 'bae57309-ad03-486e-a73a-d3bbe9b62c21', 'allow', 4, '{"path": "/:account(/:section(/:itemId))"}', false, NULL, '{"data": null, "type": "default"}'),
	('5bc346df-fb0b-4f5c-9880-a890247cc84d', '9da4240c-9478-45e1-864c-aa17a33ac6c9', 'allow', 0, '{"path": "/:section(/:subsection(/:dashboardName))", "domain": ":workspace.app.preset.io"}', false, NULL, '{"data": null, "type": "default"}'),
	('25810901-c2d6-4342-b685-2f846f4ec71f', '91560f94-8d01-4370-a4ec-b50ce097295b', 'allow', 0, '{"path": "/:section/:accountId/:objectType/:objectId"}', false, NULL, '{"data": null, "type": "default"}'),
	('76c820c6-3e6f-4cbe-86ac-a945a5153e4a', '91560f94-8d01-4370-a4ec-b50ce097295b', 'allow', 1, '{"path": "/:section/:accountId/:objectType/:view/:subsection/:segment(/:subsegment)"}', false, NULL, '{"data": null, "type": "default"}'),
	('8c54aff9-d81e-43ff-a088-00d8a6d16afe', '91560f94-8d01-4370-a4ec-b50ce097295b', 'allow', 2, '{"path": "/:section/:accountId/:subsection/:objectId/:view"}', false, NULL, '{"data": null, "type": "default"}'),
	('0b8c7359-bd6e-42db-b170-0539874ab8b5', '91560f94-8d01-4370-a4ec-b50ce097295b', 'allow', 3, '{"path": "/:section/:accountId/:subsection"}', false, NULL, '{"data": null, "type": "default"}'),
	('d45922cd-d3cf-443b-a9a7-590be0cfc256', '26b741d2-67cd-4fa4-93ce-c7ce28402b54', 'allow', 0, '{"path": "/:section(/:subsection)"}', false, NULL, '{"data": null, "type": "default"}'),
	('5be56345-2a5a-437f-a093-89086028d0bd', '5449b799-130c-462c-bec8-15cd68eab895', 'allow', 0, '{"path": "/question", "domain": "bi.:env.netpurpose.com"}', true, '
      {{assign "h1" (querySelector document "h1") }}
      {{#with (textContent (querySelector (parentNode h1) "span")) as |type|}}
        {{type}} {{textContent @root.h1}}
      {{else}}
        {{#with (querySelector document "h2") as |h2| }}
          {{textContent h2}}
        {{else}}
          Metabase
        {{/with}}
      {{/with}}
    ', '{"data": null, "type": "metabase"}'),
	('59ea23a5-ac7c-4ff5-a040-27077e4b3397', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'allow', 0, '{"domain": "control.:env.netpurpose.com", "contains": "Fact ID:", "selector": "body > div[role=\\"presentation\\"] > div.MuiPaper-root > div[direction=\\"column\\"] > .MuiTypography-root"}', false, 'Fact ID: {{context.fact}}', '{"data": {"fact": "{{#regexReplace \\"^\\\\s*Fact ID:\\" \\"\\"}}{{textContent element}}{{/regexReplace}}"}, "type": "replace"}'),
	('11726a2d-bb48-431b-b467-25ec18ef5fff', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'allow', 1, '{"path": "/:section(/:id)", "domain": "control.:env.netpurpose.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('81b07c70-5ecb-4c69-a1bb-b1defda3fcd3', '07193262-b6f8-4ac4-9378-3bc5d8b40704', 'allow', 2, '{"path": "/", "domain": "control.:env.netpurpose.com"}', false, NULL, '{"data": null, "type": "default"}'),
	('c4f85bff-e5e9-41a2-a702-4ed03269752c', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 0, '{"path": "/sales/lists/people/:personId"}', false, NULL, '{"data": null, "type": "default"}'),
	('c89f891c-a9e5-4b73-af52-4d1373fd52d1', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 1, '{"path": "/sales/lists/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('cd99fc73-ad41-417e-8617-98c06f345bc1', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 2, '{"path": "/sales/company/:companyId/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('e7a11100-087c-4931-8c73-64b6adce0bc5', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 3, '{"path": "/company/:company(/*)"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*LinkedIn\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('1931b763-ef20-44cb-8e89-dafc11cfba6f', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 4, '{"path": "/feed/hashtag/:hashtag(/*)"}', false, '#{{context.hashtag}}', '{"data": null, "type": "default"}'),
	('e6131042-042f-432c-a37e-7d7f661e51c7', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 5, '{"path": "/jobs/view/:job(/*)"}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*LinkedIn\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('c3bdbbbd-cb7a-4e60-bc8d-d1141bbfa47c', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 6, '{"path": "/jobs/search(/*)", "queryParams": {"currentJobId": ":job"}}', false, '
    {{#if title}}
      {{#regexReplace "^\\s*\\([0-9]+\\)" ""}}
        {{#regexReplace "\\|\\s*LinkedIn\\s*$" ""}}
          {{title}}
        {{/regexReplace}}
      {{/regexReplace}}
    {{else}}
      {{contextData context}}
    {{/if}}', '{"data": null, "type": "default"}'),
	('eb705d06-eac0-4d14-9e31-954c114068dc', '77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'allow', 7, '{"path": "/campaignmanager/accounts/:accountId/:section(/:campaignId/:subsection)"}', false, NULL, '{"data": {"product": "campaignmanager"}, "type": "extend"}'),
	('e440835f-9d5f-40e5-9414-29908f79722e', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'deny', 0, '{"path": "/account/login"}', false, NULL, '{"data": null, "type": "default"}'),
	('bd37dcd4-a328-4765-b94d-af3aa15fbcab', '87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'allow', 1, '{"path": "/:section(/:subsection(/:dashboardName))"}', false, NULL, '{"data": null, "type": "default"}'),
	('b45614cb-05ea-470f-b5c2-1492ab97f791', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'allow', 0, '{"hash": "report/:reportId/*", "path": "/report/:accountId/view/:projectId/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('fa92d0db-b38e-4953-807a-c9c8115986bc', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'allow', 1, '{"hash": "id=:dashboardId", "path": "/report/:accountId/view/:projectId/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('87af4acb-dea9-4faf-b006-be128036eb94', 'aeb7b73a-452e-41f3-be98-1101691bcda9', 'allow', 2, '{"path": "/report/:accountId/view/:projectId/:section"}', false, NULL, '{"data": null, "type": "default"}'),
	('1c1aabb1-612c-4058-a083-7493df9b15a1', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'deny', 0, '{"path": "/folders/personal"}', false, NULL, '{"data": null, "type": "default"}'),
	('7afc95c8-0358-4238-be14-c969109047b6', '8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'allow', 1, '{"path": "/:section(/:itemId)"}', false, NULL, '{"data": null, "type": "default"}'),
	('e4d64f8a-d90e-4bce-957d-4eecd5731568', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'allow', 0, '{"path": "/t/:space/:section/:name/:name2(/:sheet)"}', false, NULL, '{"data": null, "type": "default"}'),
	('b32b2114-b5a6-43f6-ae40-b4a4bf1e7c9e', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'allow', 1, '{"hash": "/:section/:space/:subsection(/:name(/:sheet(?*)))", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('deec1eba-17ee-48e4-942a-82db28831d2d', '868aa5be-deae-41c7-a927-4bac4bad6ed4', 'allow', 2, '{"hash": "/:section/:space/:subsection/:name/:sheet/*/:tab(?*)", "path": "/"}', false, NULL, '{"data": null, "type": "default"}'),
	('27ee635b-93fa-485e-bd97-caebf4ac4bb3', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'allow', 0, '{"path": "/analytics/:section(/:subsection(/:item))"}', false, NULL, '{"data": null, "type": "default"}'),
	('a9470d23-03d2-4c73-81e3-c2a830b6001d', '11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'allow', 1, '{"path": "/:section(/:objectId)"}', false, NULL, '{"data": null, "type": "default"}'),
	('5b30ea89-6a25-4395-8523-aaca32bc0571', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'allow', 0, '{"hash": ":tab", "path": "/form/:formId/results"}', false, NULL, '{"data": {"subsection": "results"}, "type": "extend"}'),
	('a4c0ab38-da77-4d67-bd0b-20a82ec1e3b1', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'allow', 1, '{"path": "/form/:formId/:subsection"}', false, NULL, '{"data": null, "type": "default"}'),
	('a4eacc56-bd23-44c1-b00d-66e63988229b', '4dfb557c-ce6b-45e8-842d-214739f0c180', 'allow', 2, '{"path": "/accounts/:accountId/:subsection/:workspaceId"}', false, NULL, '{"data": null, "type": "default"}'),
	('c16b4d7a-b158-4074-936f-4490afabd4a2', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'allow', 0, '{"hash": "/settings/:subsection(/:subsection2(/:subsection3))", "path": "/t01/:account/"}', false, NULL, '{"data": {"section": "settings"}, "type": "extend"}'),
	('23c221cb-309b-4e91-b768-00f20a0b858b', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'allow', 1, '{"hash": "/impact-segment/:subsection/:objectId(/:page)", "path": "/t01/:account/"}', false, NULL, '{"data": {"section": "impact-segment"}, "type": "extend"}'),
	('6f14122e-e8f3-4b18-ae59-b473f2f7d1e5', 'ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'allow', 2, '{"hash": "/:section/:objectId(/:subsection(/:itemType/:itemId))", "path": "/t01/:account/"}', false, NULL, '{"data": null, "type": "default"}'),
	('38c5b8c2-835b-4f8b-9f62-4935949957f6', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'allow', 0, '{"path": "/org/:org(/:section(/:projectId(/:subsection)))"}', false, NULL, '{"data": null, "type": "default"}'),
	('27dffd56-68bf-4c98-aaab-9f09e685dc7c', 'd78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'allow', 1, '{"path": "/vuln/:vuln"}', false, NULL, '{"data": {"section": "vuln"}, "type": "extend"}'),
	('a5f52af0-498f-4f4c-b3bd-055619816b98', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'deny', 0, '{"domain": "(www.)sanity.studio"}', false, NULL, '{"data": null, "type": "default"}'),
	('52b9c27a-0906-4aa4-a9ba-440eef92b927', '113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'allow', 1, '{"path": "/:section/:subsection(;:pageId)", "domain": ":project.sanity.studio"}', false, NULL, '{"data": null, "type": "default"}'),
	('aee84da9-a43d-41f1-a72f-c6543addf2b5', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'deny', 0, '{"domain": "(www.)vercel.app"}', false, NULL, '{"data": null, "type": "default"}'),
	('303ea227-79af-4d41-ac27-8787f67d7f83', '7b451867-58d7-42ea-a9fd-22238dacbedf', 'allow', 1, '{"path": "/(:section(/*))", "domain": ":project.vercel.app"}', false, NULL, '{"data": null, "type": "default"}'),
	('abc0478f-2459-471b-921c-9a6b78566168', 'd19d7a6f-8fce-453a-8619-90d9c6d8c199', 'allow', 0, '{"path": "/files-pri-safe/:team-:file/:filename", "domain": "slack-files.com"}', false, '{{context.filename}}', '{"data": null, "type": "default"}'),
	('a5913ce3-7048-4d95-a2f3-38d8c81397b7', 'e54ae87a-741e-4f45-a5c0-6e28647b3d90', 'allow', 0, '{"path": "/:bucket/:filename"}', false, '{{context.filename}}', '{"data": null, "type": "default"}'),
	('15f21705-ca14-4754-b328-b2b435b55ab1', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'allow', 0, '{"domain": ":subdomain.localhost"}', false, NULL, '{"data": null, "type": "default"}'),
	('8177cb5a-71dc-4ede-9a5c-fd994b4e2a3b', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'allow', 1, '{"path": "/:workspace"}', false, NULL, '{"data": null, "type": "default"}'),
	('06dfd50d-1351-4c47-b94c-81cab718cbdb', '63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'allow', 2, '{}', false, NULL, '{"data": {"context": "localhost"}, "type": "replace"}'),
	('e6fc25b0-5a7c-4ac5-bbd9-423495e11665', 'b6a43b55-4ff5-4ffc-b506-676291747ce2', 'allow', 0, '{}', false, NULL, '{"data": {"context": "andrei.codes"}, "type": "replace"}');
INSERT INTO cord.providers VALUES
	('936f7a62-4bee-4440-a5dc-d44a4de5b187', 'Hotjar', '{insights.hotjar.com}', 'https://app.cord.com/static/provider-icons/hotjar.png', 'Open a heatmap or recording', false, false, true, true, NULL),
	('37d6bd3a-c812-4875-ab11-95003c8118bb', 'GRID', '{grid.is,www.grid.is}', 'https://app.cord.com/static/provider-icons/grid.png', 'Go into any model and leave a note for your team!', false, false, true, true, NULL),
	('5ca990f3-98fe-4e84-bed7-4b7ca152841c', 'Bubble', '{bubble.io,*.bubbleapps.io}', 'https://app.cord.com/static/provider-icons/bubble.png', 'Go into any page in Bubble and leave comments and annotations for your team!', false, false, true, true, NULL),
	('fd16d6a3-81e1-4d05-97f9-14c2ffb2a5fd', 'Cord Website', '{cord.com}', 'https://app.cord.com/static/provider-icons/cord.png', 'Click on one of the top links', false, false, false, true, NULL),
	('4999a984-16a0-4c20-901c-a31aaf41ab2a', 'Cord Workspace', '{app.cord.com}', 'https://app.cord.com/static/provider-icons/cord.png', 'Welcome to Cord', false, false, false, true, NULL),
	('433c0ca7-b4a9-4de4-ad35-7f826a87b0d5', 'Dataform', '{app.dataform.co}', 'https://app.cord.com/static/provider-icons/dataform.png', 'Go into any definition or schedule and leave annotations and comments for your team!', false, false, true, true, NULL),
	('a5d63a10-e81b-45ce-80a4-21b53d75f7ea', 'Google Ads', '{ads.google.com}', 'https://app.cord.com/static/provider-icons/google-ads.png', 'Open a Google Ad', false, false, true, true, NULL),
	('aba3c96f-822d-4555-81ef-fe0a39951a1a', 'DBT', '{cloud.getdbt.com}', 'https://app.cord.com/static/provider-icons/getdbt.png', 'Go into any environment or run and leave annotations and comments for your team!', false, false, true, true, NULL),
	('1559e0ce-b6d0-4b10-96d4-0779e128908c', 'Traktion', '{app.traktion.ai}', 'https://app.cord.com/static/provider-icons/traktion.png', 'Open any campaign or marketer to leave comments and annotations for your team!', false, false, true, true, NULL),
	('b9069b43-ef16-4f53-b47c-9ab8e4639095', 'ActiveCampaign', '{*.activehosted.com}', 'https://app.cord.com/static/provider-icons/activecampaign.png', 'Open any campaign or contact to leave comments and annotations for your team!', false, false, true, true, NULL),
	('1bc11c60-46b4-45fa-9bc1-beca8bcdffba', 'Medium', '{medium.com,*.medium.com}', 'https://app.cord.com/static/provider-icons/medium.png', 'Go into any post and leave a note for your team!', false, false, true, true, NULL),
	('b83e6b16-24d6-4759-9238-e6ce21b74d8b', 'Relate', '{dev.relate.app,relate.app}', 'https://app.cord.com/static/provider-icons/relate.png', 'Go into any page in Relate and leave comments and annotations for your team!', false, false, true, true, NULL),
	('3e275414-4e34-4672-9f30-cfa822300e7a', 'Google Analytics', '{analytics.google.com}', 'https://app.cord.com/static/provider-icons/google-analytics.png', 'Open one of the reports', false, false, true, true, NULL),
	('9102c8b1-b4a7-4dda-9db1-888e6266230f', 'Framer', '{framer.com}', 'https://app.cord.com/static/provider-icons/framer.png', 'Go into any wireframe and leave comments and annotations for your team!', false, false, true, true, NULL),
	('f2851b03-e0d8-416c-9787-22270a3ff9a5', 'Phabricator', '{*.phacility.com}', 'https://app.cord.com/static/provider-icons/phabricator.png', 'Open a task or a diff', false, false, true, true, NULL),
	('42af9b53-c4f9-41b4-8c8d-3b286b168c2d', 'Xero', '{go.xero.com,reporting.xero.com}', 'https://app.cord.com/static/provider-icons/xero.png', 'Open a Xero section', false, false, true, true, NULL),
	('f15a72de-75e6-4595-af36-fb6ac748e6b8', 'SendGrid', '{mc.sendgrid.com,app.sendgrid.com}', 'https://app.cord.com/static/provider-icons/sendgrid.png', 'Open a section', false, false, true, true, NULL),
	('74987f27-86b4-4c18-8387-eed009535254', 'Internal', '{secure.internal.io}', 'https://app.cord.com/static/provider-icons/internalio.png', 'Go into any space and leave notes and comments to your team', false, false, true, true, NULL),
	('b03b79ab-2f0a-43d2-90a9-490fd99935c0', 'Google Data Studio', '{datastudio.google.com}', 'https://app.cord.com/static/provider-icons/google-datastudio.png', NULL, false, false, true, true, NULL),
	('c1ae0435-1f72-4bc1-990f-3d5eca03edac', 'Amazon Web Services', '{*.aws.amazon.com}', 'https://app.cord.com/static/provider-icons/aws.png', 'Go into any Web Service and leave notes for your team!', false, false, true, true, NULL),
	('64397736-9a62-4b21-a7b5-5ee5d86bfd27', 'BigQuery', '{console.cloud.google.com}', 'https://app.cord.com/static/provider-icons/google-cloud.png', NULL, false, false, true, true, NULL),
	('cc0ba56f-e73c-4027-acdb-3f9dd1ba38f3', 'Heap', '{heapanalytics.com,*.heapanalytics.com}', 'https://app.cord.com/static/provider-icons/heapanalytics.png', 'Go into any report and leave notes and comments to your team!', false, false, true, true, NULL),
	('07413d4f-5bdb-4625-b0bc-a3b2173f3e0b', 'Mailchimp', '{*.admin.mailchimp.com}', 'https://app.cord.com/static/provider-icons/mailchimp.png', 'Go into any campaign or template and leave comments for your team!', false, false, true, true, NULL),
	('707d5823-6492-46ee-83b2-fb9f0a4fa506', 'Retool', '{retool.com,*.retool.com,tryretool.com,*.tryretool.com}', 'https://app.cord.com/static/provider-icons/retool.png', 'Go into any app and leave a note for your team!', false, false, true, true, NULL),
	('90c5b80a-e9fa-4c70-bcf3-e7cd1e7bc4f0', 'Webflow', '{webflow.com}', 'https://app.cord.com/static/provider-icons/webflow.png', 'Open one of your sites', false, false, true, true, NULL),
	('bcf43368-40fa-4b26-b821-889a6a3d9d81', 'Snowflake', '{*.snowflakecomputing.com}', 'https://app.cord.com/static/provider-icons/snowflake.png', 'Open a query or analyze a database', true, false, true, true, NULL),
	('fc48f4d2-509a-4323-b49b-6365492bd93a', 'Deliveroo', '{deliveroo.co.uk}', 'https://app.cord.com/static/provider-icons/deliveroo.png', 'Go into any restaurant and yum yum yum! 🍕🍔', false, false, true, true, NULL),
	('99c576b8-e4f3-47f3-97ff-4c95ab45b106', 'Atlassian', '{*.atlassian.net}', 'https://app.cord.com/static/provider-icons/jira.svg', 'Go into a project or an issue and get your team on the same page!', false, false, true, true, NULL),
	('2c61cd17-050d-4b06-bf0d-5876d51dbe86', 'Crunchbase', '{crunchbase.com,www.crunchbase.com}', 'https://app.cord.com/static/provider-icons/crunchbase.png', 'Take notes on companies, investors and rounds', false, false, true, true, NULL),
	('1bd77193-23ad-4fb1-abd0-6bca462c8ae5', 'Salesforce', '{*.force.com,*.salesforce.com}', 'https://app.cord.com/static/provider-icons/salesforce.png', 'Go into an account or an opportunity to discuss them with your team!', false, false, true, true, NULL),
	('bae57309-ad03-486e-a73a-d3bbe9b62c21', 'Chartio', '{www.chartio.com,chartio.com}', 'https://app.cord.com/static/provider-icons/chartio.png', 'Go into any Dashboard and leave annotations and comments for your team!', false, false, true, true, NULL),
	('9f83913b-9657-460e-b6ce-b3305f6acdae', 'Twitter Ads', '{ads.twitter.com}', 'https://app.cord.com/static/provider-icons/twitter.png', 'Go into any campaign or promoted tweet and leave notes for your team!', false, false, true, true, NULL),
	('91560f94-8d01-4370-a4ec-b50ce097295b', 'HubSpot', '{hubspot.com,app.hubspot.com,www.hubspot.com}', 'https://app.cord.com/static/provider-icons/hubspot.png', 'Click on any account record and leave notes for your team!', false, false, true, true, NULL),
	('9da4240c-9478-45e1-864c-aa17a33ac6c9', 'Preset', '{*.app.preset.io}', 'https://app.cord.com/static/provider-icons/preset.png', 'Go into any dataset, dashboard or chart and leave notes and annotations for your team!', false, false, true, true, NULL),
	('d19d7a6f-8fce-453a-8619-90d9c6d8c199', 'Slack Files', '{slack-files.com}', 'https://app.cord.com/static/provider-icons/slack.png', 'Discuss and annotate attachments with your team.', false, true, false, true, NULL),
	('aeb7b73a-452e-41f3-be98-1101691bcda9', 'Mixpanel', '{mixpanel.com,eu.mixpanel.com}', 'https://app.cord.com/static/provider-icons/mixpanel.png', 'Go into any dashboard or funnel and leave comments to your team!', false, false, true, true, NULL),
	('26b741d2-67cd-4fa4-93ce-c7ce28402b54', 'Hivemind', '{*.hvmd.io}', 'https://app.cord.com/static/provider-icons/hvmd.png', 'Go into any page and leave notes and comments to your team!', false, false, true, true, NULL),
	('5449b799-130c-462c-bec8-15cd68eab895', 'Net Purpose Metabase', '{bi.*.netpurpose.com}', 'https://app.cord.com/static/provider-icons/metabase.png', 'Go into any collection and leave notes and comments to your team!', false, false, false, true, NULL),
	('8a7c6ee0-f6ae-4fb5-bd57-51543b1af098', 'Smartsheet', '{app.smartsheet.com}', 'https://app.cord.com/static/provider-icons/smartsheet.png', 'Go into any sheet and add annotations or collaborate with your team!', false, false, true, true, NULL),
	('07193262-b6f8-4ac4-9378-3bc5d8b40704', 'Net Purpose Control Tool', '{control.*.netpurpose.com}', 'https://app.cord.com/static/provider-icons/metabase.png', 'Go into any fact and leave notes and comments to your team!', false, false, false, true, NULL),
	('ff46282e-5dc5-409d-a2da-b52bc220d9b8', 'Totango', '{app.totango.com}', 'https://app.cord.com/static/provider-icons/totango.png', 'Go into any successBLOC or account and collaborate with your team!', false, false, true, true, NULL),
	('e54ae87a-741e-4f45-a5c0-6e28647b3d90', 'Google Storage', '{storage.googleapis.com}', 'https://app.cord.com/static/provider-icons/google-storage.png', 'Discuss and annotate documents with your team.', false, true, false, true, NULL),
	('868aa5be-deae-41c7-a927-4bac4bad6ed4', 'Tableau', '{*.online.tableau.com}', 'https://app.cord.com/static/provider-icons/tableau.png', 'Go into any dashboard and add annotations or collaborate with your team!', false, false, true, true, NULL),
	('77103806-1129-4846-b0bd-6fbdc5d8a8a8', 'LinkedIn', '{linkedin.com,www.linkedin.com}', 'https://app.cord.com/static/provider-icons/linkedin.png', 'Take notes on candidates, companies and jobs', false, false, true, true, NULL),
	('d78a8b80-f417-43f1-913c-fc9e84c8cc2c', 'Snyk', '{app.snyk.io}', 'https://app.cord.com/static/provider-icons/snyk.png', 'Go into any vuln or report and leave comments for your team!', false, false, true, true, NULL),
	('11391aac-a8dc-406e-86e9-d4eaaaf1d81a', 'Gainsight', '{app.aptrinsic.com}', 'https://app.cord.com/static/provider-icons/aptrinsic.png', 'Go into any report, engagement or segment and collaborate with your team!', false, false, true, true, NULL),
	('87b0be53-bb30-4afd-8923-bcf6e09a6f17', 'Datadog', '{app.datadoghq.com}', 'https://app.cord.com/static/provider-icons/datadog.png', 'Go into any monitor, map or dashboard and leave notes and annotations for your team!', false, false, true, true, NULL),
	('63ea82ec-ad74-44ae-a4a9-d541bcd66c7d', 'localhost', '{localhost,0.0.0.0,*.localhost}', 'https://app.cord.com/static/provider-icons/localhost.png', NULL, false, false, false, true, NULL),
	('113dfc88-e78b-40d0-9788-e8152ff2d7f2', 'Sanity', '{*.sanity.studio}', 'https://app.cord.com/static/provider-icons/sanity.png', 'Go into any page in the CMS and comment on and annotate fields!', false, false, true, true, NULL),
	('4dfb557c-ce6b-45e8-842d-214739f0c180', 'Typeform', '{admin.typeform.com}', 'https://app.cord.com/static/provider-icons/typeform.png', 'Go into any survey and leave notes and comments to your team!', false, false, true, true, NULL),
	('b6a43b55-4ff5-4ffc-b506-676291747ce2', 'Andrei personal website', '{andrei.codes}', 'https://andrei.codes/favicon.png', NULL, false, false, false, true, NULL),
	('7b451867-58d7-42ea-a9fd-22238dacbedf', 'Vercel', '{*.vercel.app}', 'https://app.cord.com/static/provider-icons/vercel.png', 'Go into any page in your staging website and leave comments and annotations for your team!', false, false, true, true, NULL);
INSERT INTO cord.users VALUES
	('d8009e91-03b8-4f17-9493-7855af13a5b2', '2022-09-29 10:01:34.197829+00', 'person', false, 'active', 'Andrei', '2022-08-16 12:00:00+00', NULL, 'andrei@cord.com', 'https://ca.slack-edge.com/T012Y0TBQLW-U0134UJMCG3-da029c9556f6-512', '2022-08-16 12:00:00+00', 'andrei', 'platform', 'b6501bf5-46f7-4db7-9996-c42dd9f758b0', '{}', '2024-01-17 10:46:14.917442+00'),
	('f41627b5-d83a-4b71-8273-e2246623bf02', '2022-09-29 10:01:34.197829+00', 'person', false, 'active', 'Flooey', '2022-08-16 12:00:00+00', NULL, 'flooey@cord.com', 'https://ca.slack-edge.com/T012Y0TBQLW-U02D2DNCS3H-71dafa543b5d-512', '2022-08-16 12:00:00+00', 'flooey', 'platform', 'b6501bf5-46f7-4db7-9996-c42dd9f758b0', '{}', '2024-01-17 10:46:14.917442+00');
ALTER TABLE ONLY cord.admin_chat_channels
    ADD CONSTRAINT admin_chat_channels_name_key UNIQUE (name);
ALTER TABLE ONLY cord.admin_chat_channels
    ADD CONSTRAINT admin_chat_channels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.admin_crt_customer_issue_changes
    ADD CONSTRAINT admin_crt_customer_issue_changes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.admin_crt_customer_issue_subscriptions
    ADD CONSTRAINT admin_crt_customer_issue_subscriptions_pkey PRIMARY KEY ("issueID", "userID");
ALTER TABLE ONLY cord.admin_crt_customer_issues
    ADD CONSTRAINT admin_crt_customer_issues_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.admin_go_redirects
    ADD CONSTRAINT admin_go_redirects_name_key UNIQUE (name);
ALTER TABLE ONLY cord.admin_go_redirects
    ADD CONSTRAINT admin_go_redirects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.application_usage_metric_types
    ADD CONSTRAINT application_usage_metric_types_metric_id_key UNIQUE (metric) INCLUDE (id);
ALTER TABLE ONLY cord.application_usage_metric_types
    ADD CONSTRAINT application_usage_metric_types_pkey PRIMARY KEY (id) INCLUDE (metric);
ALTER TABLE ONLY cord.application_usage_metrics
    ADD CONSTRAINT application_usage_metrics_pkey PRIMARY KEY ("applicationID", "metricID", date);
ALTER TABLE ONLY cord.application_webhooks
    ADD CONSTRAINT application_webhooks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.console_users
    ADD CONSTRAINT console_users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.deploys
    ADD CONSTRAINT deploys_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.email_notifications
    ADD CONSTRAINT email_notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.email_subscription
    ADD CONSTRAINT email_subscription_pkey PRIMARY KEY ("userID", "threadID");
ALTER TABLE ONLY cord.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.external_assets
    ADD CONSTRAINT external_assets_pkey PRIMARY KEY (url);
ALTER TABLE ONLY cord.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.heimdall
    ADD CONSTRAINT heimdall_pkey PRIMARY KEY (tier, key);
ALTER TABLE ONLY cord.image_variants
    ADD CONSTRAINT image_variants_pkey PRIMARY KEY ("sourceSha384", variant);
ALTER TABLE ONLY cord.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT linked_orgs_pkey PRIMARY KEY ("sourceOrgID", "linkedOrgID");
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_sourceOrgID_key" UNIQUE ("sourceOrgID");
ALTER TABLE ONLY cord.linked_users
    ADD CONSTRAINT linked_users_pkey PRIMARY KEY ("sourceUserID", "sourceOrgID", "linkedUserID", "linkedOrgID");
ALTER TABLE ONLY cord.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.message_link_previews
    ADD CONSTRAINT "message_link_previews_messageID_url_key" UNIQUE ("messageID", url);
ALTER TABLE ONLY cord.message_link_previews
    ADD CONSTRAINT message_link_previews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.message_mentions
    ADD CONSTRAINT message_mentions_pkey PRIMARY KEY ("userID", "messageID");
ALTER TABLE ONLY cord.message_notifications
    ADD CONSTRAINT message_notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.message_reactions
    ADD CONSTRAINT "message_reactions_userID_messageID_unicodeReaction_key" UNIQUE ("userID", "messageID", "unicodeReaction");
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_externalID_platformApplicationID_key" UNIQUE ("externalID", "platformApplicationID");
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_orgID_id_key" UNIQUE ("orgID", id);
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_externalID_platformApplicationID_key" UNIQUE ("externalID", "platformApplicationID");
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.org_members
    ADD CONSTRAINT org_members_pkey PRIMARY KEY ("orgID", "userID");
ALTER TABLE ONLY cord.orgs
    ADD CONSTRAINT orgs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.page_visitors
    ADD CONSTRAINT page_visitors_pkey PRIMARY KEY ("pageContextHash", "orgID", "userID");
ALTER TABLE ONLY cord.pages
    ADD CONSTRAINT "pages_orgID_providerID_contextHash_key" UNIQUE ("orgID", "providerID", "contextHash");
ALTER TABLE ONLY cord.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY ("orgID", "contextHash");
ALTER TABLE ONLY cord.permission_rules
    ADD CONSTRAINT permission_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.preallocated_thread_ids
    ADD CONSTRAINT preallocated_thread_ids_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.preallocated_thread_ids
    ADD CONSTRAINT "preallocated_thread_ids_platformApplicationID_externalID_key" UNIQUE ("platformApplicationID", "externalID");
ALTER TABLE ONLY cord.provider_document_mutators
    ADD CONSTRAINT provider_document_mutators_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.provider_rule_tests
    ADD CONSTRAINT provider_rule_tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.provider_rules
    ADD CONSTRAINT provider_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.provider_rules
    ADD CONSTRAINT "provider_rules_providerID_order_key" UNIQUE ("providerID", "order") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.published_providers
    ADD CONSTRAINT published_providers_pkey PRIMARY KEY ("providerID");
ALTER TABLE ONLY cord.s3_buckets
    ADD CONSTRAINT s3_buckets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.slack_channels
    ADD CONSTRAINT slack_channels_pkey PRIMARY KEY ("orgID", "slackID");
ALTER TABLE ONLY cord.slack_messages
    ADD CONSTRAINT slack_messages_pkey PRIMARY KEY ("slackOrgID", "slackChannelID", "slackMessageTimestamp");
ALTER TABLE ONLY cord.slack_mirrored_support_threads
    ADD CONSTRAINT slack_mirrored_support_threads_pkey PRIMARY KEY ("threadID");
ALTER TABLE ONLY cord.slack_mirrored_threads
    ADD CONSTRAINT slack_mirrored_threads_pkey PRIMARY KEY ("threadID");
ALTER TABLE ONLY cord.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY ("userID", "taskID");
ALTER TABLE ONLY cord.task_third_party_references
    ADD CONSTRAINT task_third_party_references_pkey PRIMARY KEY ("taskID", "externalID", "externalConnectionType");
ALTER TABLE ONLY cord.task_third_party_subscriptions
    ADD CONSTRAINT task_third_party_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.task_todos
    ADD CONSTRAINT task_todos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.third_party_connections
    ADD CONSTRAINT third_party_connections_pkey PRIMARY KEY ("orgID", "userID", type);
ALTER TABLE ONLY cord.thread_participants
    ADD CONSTRAINT thread_participants_pkey PRIMARY KEY ("threadID", "orgID", "userID");
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_orgID_id_key" UNIQUE ("orgID", id);
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_platformApplicationID_externalID_key" UNIQUE ("platformApplicationID", "externalID");
ALTER TABLE ONLY cord.user_hidden_annotations
    ADD CONSTRAINT user_hidden_annotations_pkey PRIMARY KEY ("userID", "annotationID");
ALTER TABLE ONLY cord.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY ("userID", key);
ALTER TABLE ONLY cord.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY cord.warm_demo_users
    ADD CONSTRAINT warm_demo_users_pkey PRIMARY KEY (id);
CREATE INDEX "admin_crt_customer_issue_subscriptions_userID_issueID_idx" ON cord.admin_crt_customer_issue_subscriptions USING btree ("userID", "issueID");
CREATE INDEX "admin_crt_customer_issues_customerID_idx" ON cord.admin_crt_customer_issues USING btree ("customerID");
CREATE UNIQUE INDEX "application_webhooks_platformApplicationID_eventWebhookURL_idx" ON cord.application_webhooks USING btree ("platformApplicationID", "eventWebhookURL");
CREATE UNIQUE INDEX "applications_supportOrgID_supportSlackChannelID_idx" ON cord.applications USING btree ("supportOrgID", "supportSlackChannelID");
CREATE UNIQUE INDEX console_users_email_idx ON cord.console_users USING btree (email);
CREATE UNIQUE INDEX "email_notifications_id_threadID_userID_threadOrgID_idx" ON cord.email_notifications USING btree (id, "threadID", "userID", "threadOrgID");
CREATE INDEX "email_notifications_threadID_idx" ON cord.email_notifications USING btree ("threadID");
CREATE INDEX "email_notifications_userID_idx" ON cord.email_notifications USING btree ("userID");
CREATE INDEX "email_subscription_threadID_idx" ON cord.email_subscription USING btree ("threadID");
CREATE INDEX "events_type_platformApplicationID_idx" ON cord.events USING btree (type, "platformApplicationID");
CREATE INDEX "events_type_serverTimestamp_idx" ON cord.events USING btree (type, "serverTimestamp");
CREATE INDEX "files_userID_idx" ON cord.files USING btree ("userID");
CREATE INDEX "invites_orgID_creatorUserID_idx" ON cord.invites USING btree ("orgID", "creatorUserID");
CREATE INDEX "invites_orgID_invitedUserID_idx" ON cord.invites USING btree ("orgID", "invitedUserID");
CREATE INDEX "linked_users_linkedUserID_sourceUserID_idx" ON cord.linked_users USING btree ("linkedUserID", "sourceUserID");
CREATE INDEX "message_attachments_messageID_idx" ON cord.message_attachments USING btree ("messageID");
CREATE INDEX "message_link_previews_messageID_idx" ON cord.message_link_previews USING btree ("messageID");
CREATE INDEX "message_mentions_messageID_userID_idx" ON cord.message_mentions USING btree ("messageID", "userID");
CREATE INDEX "message_mentions_userID_idx" ON cord.message_mentions USING btree ("userID");
CREATE INDEX "message_notifications_messageID_idx" ON cord.message_notifications USING btree ("messageID");
CREATE INDEX "message_notifications_targetOrgID_targetUserID_idx" ON cord.message_notifications USING btree ("targetOrgID", "targetUserID");
CREATE INDEX "message_notifications_targetUserID_idx" ON cord.message_notifications USING btree ("targetUserID");
CREATE INDEX "message_reactions_messageID_idx" ON cord.message_reactions USING btree ("messageID");
CREATE INDEX "message_reactions_userID_idx" ON cord.message_reactions USING btree ("userID");
CREATE INDEX "messages_contentTsVector_idx" ON cord.messages USING gin ("contentTsVector");
CREATE INDEX messages_metadata_idx ON cord.messages USING gin (metadata);
CREATE INDEX "messages_orgID_sourceID_idx" ON cord.messages USING btree ("orgID", "sourceID");
CREATE INDEX "messages_sourceID_idx" ON cord.messages USING btree ("sourceID");
CREATE INDEX "messages_threadID_timestamp_idx" ON cord.messages USING btree ("threadID", "timestamp");
CREATE INDEX "notifications_messageID_idx" ON cord.notifications USING btree ("messageID") WHERE ("messageID" IS NOT NULL);
CREATE INDEX notifications_metadata_idx ON cord.notifications USING gin (metadata);
CREATE INDEX "notifications_reactionID_idx" ON cord.notifications USING btree ("reactionID") WHERE ("reactionID" IS NOT NULL);
CREATE INDEX "notifications_recipientID_idx" ON cord.notifications USING btree ("recipientID");
CREATE INDEX "notifications_senderID_idx" ON cord.notifications USING btree ("senderID") WHERE ("senderID" IS NOT NULL);
CREATE INDEX optimize_new_errors ON cord.events USING btree ("serverTimestamp") WHERE (type = ANY (ARRAY['react-error'::text, 'graphql-error'::text]));
CREATE UNIQUE INDEX "org_members_orgID_userID_key" ON cord.org_members USING btree ("userID", "orgID");
CREATE UNIQUE INDEX "orgs_externalProvider_externalID_idx" ON cord.orgs USING btree ("externalProvider", "externalID") WHERE ("platformApplicationID" IS NULL);
CREATE UNIQUE INDEX "orgs_id_externalProvider_idx" ON cord.orgs USING btree (id, "externalProvider");
CREATE INDEX orgs_metadata_idx ON cord.orgs USING gin (metadata);
CREATE UNIQUE INDEX "orgs_platformApplicationID_externalID_externalProvider_idx" ON cord.orgs USING btree ("platformApplicationID", "externalID", "externalProvider") WHERE ("platformApplicationID" IS NOT NULL);
CREATE INDEX "page_visitors_orgID_userID_idx" ON cord.page_visitors USING btree ("orgID", "userID");
CREATE INDEX "page_visitors_userID_idx" ON cord.page_visitors USING btree ("userID");
CREATE INDEX "pages_contextData_idx" ON cord.pages USING gin ("contextData");
CREATE INDEX "permission_rules_platformApplicationID_idx" ON cord.permission_rules USING btree ("platformApplicationID");
CREATE INDEX "sessions_applicationID_idx" ON cord.sessions USING btree ("applicationID");
CREATE INDEX "slack_messages_messageID_idx" ON cord.slack_messages USING btree ("messageID");
CREATE INDEX "slack_messages_sharerOrgID_sharerUserID_idx" ON cord.slack_messages USING btree ("sharerOrgID", "sharerUserID");
CREATE UNIQUE INDEX "slack_mirrored_support_thread_slackOrgID_slackChannelID_sla_idx" ON cord.slack_mirrored_support_threads USING btree ("slackOrgID", "slackChannelID", "slackMessageTimestamp");
CREATE INDEX "slack_mirrored_support_threads_threadID_idx" ON cord.slack_mirrored_support_threads USING btree ("threadID");
CREATE UNIQUE INDEX "slack_mirrored_threads_slackOrgID_slackChannelID_slackMessa_idx" ON cord.slack_mirrored_threads USING btree ("slackOrgID", "slackChannelID", "slackMessageTimestamp");
CREATE INDEX "slack_mirrored_threads_threadID_idx" ON cord.slack_mirrored_threads USING btree ("threadID");
CREATE INDEX "task_assignees_orgID_assignerID_idx" ON cord.task_assignees USING btree ("orgID", "assignerID");
CREATE INDEX "task_assignees_orgID_userID_idx" ON cord.task_assignees USING btree ("orgID", "userID");
CREATE INDEX "task_assignees_taskID_idx" ON cord.task_assignees USING btree ("taskID");
CREATE INDEX "task_third_party_references_taskTodoID_idx" ON cord.task_third_party_references USING btree ("taskTodoID");
CREATE INDEX "task_todos_taskID_idx" ON cord.task_todos USING btree ("taskID");
CREATE INDEX "tasks_messageID_idx" ON cord.tasks USING btree ("messageID");
CREATE UNIQUE INDEX thread_messages_imported_slack ON cord.messages USING btree ("orgID", "threadID", "importedSlackChannelID", "importedSlackMessageTS") WHERE ("importedSlackChannelID" IS NOT NULL);
CREATE INDEX "thread_participants_orgID_userID_threadID_idx" ON cord.thread_participants USING btree ("orgID", "userID", "threadID");
CREATE INDEX "thread_participants_threadID_userID_idx" ON cord.thread_participants USING btree ("threadID", "userID");
CREATE INDEX "thread_participants_userID_idx" ON cord.thread_participants USING btree ("userID");
CREATE INDEX threads_metadata_idx ON cord.threads USING gin (metadata);
CREATE INDEX "threads_platformApplicationID_idx" ON cord.threads USING btree ("platformApplicationID");
CREATE INDEX "threads_resolverUserID_idx" ON cord.threads USING btree ("resolverUserID");
CREATE INDEX "user_hidden_annotations_annotationID_idx" ON cord.user_hidden_annotations USING btree ("annotationID");
CREATE INDEX "user_hidden_annotations_userID_orgID_pageContextHash_idx" ON cord.user_hidden_annotations USING btree ("userID", "orgID", "pageContextHash");
CREATE INDEX users_email_idx ON cord.users USING btree (email);
CREATE INDEX "users_externalID_idx" ON cord.users USING btree ("externalID") WHERE ("externalProvider" = 'slack'::cord.profile_external_provider_type);
CREATE INDEX users_metadata_idx ON cord.users USING gin (metadata);
CREATE UNIQUE INDEX "users_platformApplicationID_externalID_idx" ON cord.users USING btree ("platformApplicationID", "externalID") WHERE ("platformApplicationID" IS NOT NULL);
CREATE INDEX "users_platformApplicationID_lower_idx" ON cord.users USING btree ("platformApplicationID", lower(name));
CREATE INDEX "users_platformApplicationID_lower_idx1" ON cord.users USING btree ("platformApplicationID", lower("screenName"));
CREATE INDEX "users_platformApplicationID_updatedTimestamp_idx" ON cord.users USING btree ("platformApplicationID", "updatedTimestamp");
CREATE TRIGGER add_message_external_id_trigger BEFORE INSERT ON cord.messages FOR EACH ROW EXECUTE FUNCTION cord.add_external_id_if_null();
CREATE TRIGGER add_notification_external_id_trigger BEFORE INSERT ON cord.notifications FOR EACH ROW EXECUTE FUNCTION cord.add_external_id_if_null();
CREATE TRIGGER add_thread_external_id_trigger BEFORE INSERT ON cord.threads FOR EACH ROW EXECUTE FUNCTION cord.add_external_id_if_null();
CREATE TRIGGER add_user_external_id_trigger BEFORE INSERT ON cord.users FOR EACH ROW EXECUTE FUNCTION cord.add_external_id_if_null();
CREATE TRIGGER dirty_on_delete_trigger AFTER DELETE ON cord.provider_document_mutators FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_delete_trigger AFTER DELETE ON cord.provider_rules FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_insert_trigger AFTER INSERT ON cord.provider_document_mutators FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_insert_trigger AFTER INSERT ON cord.provider_rules FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_insert_trigger BEFORE INSERT ON cord.providers FOR EACH ROW WHEN ((NOT new.dirty)) EXECUTE FUNCTION cord.trigger_provider_dirty_update();
CREATE TRIGGER dirty_on_update_trigger AFTER UPDATE ON cord.provider_document_mutators FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_update_trigger AFTER UPDATE ON cord.provider_rules FOR EACH ROW EXECUTE FUNCTION cord.trigger_provider_mark_dirty();
CREATE TRIGGER dirty_on_update_trigger BEFORE UPDATE OF id, name, domains, "iconURL", "nuxText", "mergeHashWithLocation", "disableAnnotations", "visibleInDiscoverToolsSection" ON cord.providers FOR EACH ROW WHEN ((NOT old.dirty)) EXECUTE FUNCTION cord.trigger_provider_dirty_update();
CREATE TRIGGER trigger_user_update_timestamp BEFORE UPDATE ON cord.users FOR EACH ROW EXECUTE FUNCTION cord.user_update_timestamp();
ALTER TABLE ONLY cord.admin_crt_customer_issue_changes
    ADD CONSTRAINT "admin_crt_customer_issue_changes_issueID_fkey" FOREIGN KEY ("issueID") REFERENCES cord.admin_crt_customer_issues(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.admin_crt_customer_issue_changes
    ADD CONSTRAINT "admin_crt_customer_issue_changes_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id);
ALTER TABLE ONLY cord.admin_crt_customer_issue_subscriptions
    ADD CONSTRAINT "admin_crt_customer_issue_subscriptions_issueID_fkey" FOREIGN KEY ("issueID") REFERENCES cord.admin_crt_customer_issues(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.admin_crt_customer_issue_subscriptions
    ADD CONSTRAINT "admin_crt_customer_issue_subscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.admin_crt_customer_issues
    ADD CONSTRAINT admin_crt_customer_issues_assignee_fkey FOREIGN KEY (assignee) REFERENCES cord.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.admin_crt_customer_issues
    ADD CONSTRAINT "admin_crt_customer_issues_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES cord.customers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.admin_go_redirects
    ADD CONSTRAINT "admin_go_redirects_creatorUserID_fkey" FOREIGN KEY ("creatorUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.admin_go_redirects
    ADD CONSTRAINT "admin_go_redirects_updaterUserID_fkey" FOREIGN KEY ("updaterUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.application_usage_metrics
    ADD CONSTRAINT "application_usage_metrics_applicationID_fkey" FOREIGN KEY ("applicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.application_usage_metrics
    ADD CONSTRAINT "application_usage_metrics_metricID_fkey" FOREIGN KEY ("metricID") REFERENCES cord.application_usage_metric_types(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.application_webhooks
    ADD CONSTRAINT "application_webhooks_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT "applications_customS3Bucket_fkey" FOREIGN KEY ("customS3Bucket") REFERENCES cord.s3_buckets(id);
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT "applications_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES cord.customers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT "applications_defaultProvider_fkey" FOREIGN KEY ("defaultProvider") REFERENCES cord.providers(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT "applications_supportBotID_fkey" FOREIGN KEY ("supportBotID") REFERENCES cord.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.applications
    ADD CONSTRAINT "applications_supportOrgID_fkey" FOREIGN KEY ("supportOrgID") REFERENCES cord.orgs(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.console_users
    ADD CONSTRAINT "console_users_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES cord.customers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.console_users
    ADD CONSTRAINT "console_users_pendingCustomerID_fkey" FOREIGN KEY ("pendingCustomerID") REFERENCES cord.customers(id);
ALTER TABLE ONLY cord.email_notifications
    ADD CONSTRAINT "email_notifications_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.email_notifications
    ADD CONSTRAINT "email_notifications_threadID_fkey" FOREIGN KEY ("threadID") REFERENCES cord.threads(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.email_notifications
    ADD CONSTRAINT "email_notifications_threadOrgID_fkey" FOREIGN KEY ("threadOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.email_notifications
    ADD CONSTRAINT "email_notifications_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.email_subscription
    ADD CONSTRAINT "email_subscription_threadID_fkey" FOREIGN KEY ("threadID") REFERENCES cord.threads(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.email_subscription
    ADD CONSTRAINT "email_subscription_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.files
    ADD CONSTRAINT "files_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.files
    ADD CONSTRAINT "files_s3Bucket_fkey" FOREIGN KEY ("s3Bucket") REFERENCES cord.s3_buckets(id);
ALTER TABLE ONLY cord.files
    ADD CONSTRAINT "files_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.invites
    ADD CONSTRAINT "invites_creatorUserID_fkey" FOREIGN KEY ("creatorUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_linkedOrgID_fkey" FOREIGN KEY ("linkedOrgID") REFERENCES cord.orgs(id);
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_linkedOrgID_linkedExternalProvider_fkey" FOREIGN KEY ("linkedOrgID", "linkedExternalProvider") REFERENCES cord.orgs(id, "externalProvider");
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_mergerUserID_fkey" FOREIGN KEY ("mergerUserID") REFERENCES cord.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_sourceOrgID_fkey" FOREIGN KEY ("sourceOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.linked_orgs
    ADD CONSTRAINT "linked_orgs_sourceOrgID_sourceExternalProvider_fkey" FOREIGN KEY ("sourceOrgID", "sourceExternalProvider") REFERENCES cord.orgs(id, "externalProvider") ON DELETE CASCADE;
ALTER TABLE ONLY cord.linked_users
    ADD CONSTRAINT "linked_users_linkedUserID_fkey" FOREIGN KEY ("linkedUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.linked_users
    ADD CONSTRAINT "linked_users_sourceOrgID_linkedOrgID_fkey" FOREIGN KEY ("sourceOrgID", "linkedOrgID") REFERENCES cord.linked_orgs("sourceOrgID", "linkedOrgID") ON DELETE CASCADE;
ALTER TABLE ONLY cord.linked_users
    ADD CONSTRAINT "linked_users_sourceUserID_fkey" FOREIGN KEY ("sourceUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_attachments
    ADD CONSTRAINT "message_attachments_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_link_previews
    ADD CONSTRAINT "message_link_previews_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_mentions
    ADD CONSTRAINT "message_mentions_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_mentions
    ADD CONSTRAINT "message_mentions_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_notifications
    ADD CONSTRAINT "message_notifications_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_notifications
    ADD CONSTRAINT "message_notifications_targetOrgID_fkey" FOREIGN KEY ("targetOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_notifications
    ADD CONSTRAINT "message_notifications_targetUserID_fkey" FOREIGN KEY ("targetUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_reactions
    ADD CONSTRAINT "message_reactions_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.message_reactions
    ADD CONSTRAINT "message_reactions_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_orgID_threadID_fkey" FOREIGN KEY ("orgID", "threadID") REFERENCES cord.threads("orgID", id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_replyToEmailNotificationID_threadID_sourceID_orgI_fkey" FOREIGN KEY ("replyToEmailNotificationID", "threadID", "sourceID", "orgID") REFERENCES cord.email_notifications(id, "threadID", "userID", "threadOrgID") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.messages
    ADD CONSTRAINT "messages_sourceID_fkey" FOREIGN KEY ("sourceID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_reactionID_fkey" FOREIGN KEY ("reactionID") REFERENCES cord.message_reactions(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.notifications
    ADD CONSTRAINT "notifications_senderID_fkey" FOREIGN KEY ("senderID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.org_members
    ADD CONSTRAINT "org_members_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.org_members
    ADD CONSTRAINT "org_members_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.orgs
    ADD CONSTRAINT "orgs_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.page_visitors
    ADD CONSTRAINT "page_visitors_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.page_visitors
    ADD CONSTRAINT "page_visitors_pageContextHash_orgID_fkey" FOREIGN KEY ("pageContextHash", "orgID") REFERENCES cord.pages("contextHash", "orgID") ON DELETE CASCADE;
ALTER TABLE ONLY cord.page_visitors
    ADD CONSTRAINT "page_visitors_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.pages
    ADD CONSTRAINT "pages_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.pages
    ADD CONSTRAINT "pages_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers(id);
ALTER TABLE ONLY cord.permission_rules
    ADD CONSTRAINT "permission_rules_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.preallocated_thread_ids
    ADD CONSTRAINT "preallocated_thread_ids_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.provider_document_mutators
    ADD CONSTRAINT "provider_document_mutators_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.provider_rule_tests
    ADD CONSTRAINT "provider_rule_tests_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.provider_rules
    ADD CONSTRAINT "provider_rules_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.providers
    ADD CONSTRAINT "providers_claimingApplication_fkey" FOREIGN KEY ("claimingApplication") REFERENCES cord.applications(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.published_providers
    ADD CONSTRAINT "published_providers_providerID_fkey" FOREIGN KEY ("providerID") REFERENCES cord.providers(id);
ALTER TABLE ONLY cord.sessions
    ADD CONSTRAINT "sessions_applicationID_fkey" FOREIGN KEY ("applicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_messages
    ADD CONSTRAINT "slack_messages_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_messages
    ADD CONSTRAINT "slack_messages_sharerOrgID_fkey" FOREIGN KEY ("sharerOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_messages
    ADD CONSTRAINT "slack_messages_sharerUserID_fkey" FOREIGN KEY ("sharerUserID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_mirrored_support_threads
    ADD CONSTRAINT "slack_mirrored_support_threads_slackOrgID_fkey" FOREIGN KEY ("slackOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_mirrored_support_threads
    ADD CONSTRAINT "slack_mirrored_support_threads_threadID_threadOrgID_fkey" FOREIGN KEY ("threadID", "threadOrgID") REFERENCES cord.threads(id, "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.slack_mirrored_support_threads
    ADD CONSTRAINT "slack_mirrored_support_threads_threadOrgID_fkey" FOREIGN KEY ("threadOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_mirrored_threads
    ADD CONSTRAINT "slack_mirrored_threads_slackOrgID_fkey" FOREIGN KEY ("slackOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.slack_mirrored_threads
    ADD CONSTRAINT "slack_mirrored_threads_threadID_threadOrgID_fkey" FOREIGN KEY ("threadID", "threadOrgID") REFERENCES cord.threads(id, "orgID") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.slack_mirrored_threads
    ADD CONSTRAINT "slack_mirrored_threads_threadOrgID_fkey" FOREIGN KEY ("threadOrgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_assignees
    ADD CONSTRAINT "task_assignees_assignerID_fkey" FOREIGN KEY ("assignerID") REFERENCES cord.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.task_assignees
    ADD CONSTRAINT "task_assignees_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_assignees
    ADD CONSTRAINT "task_assignees_taskID_fkey" FOREIGN KEY ("taskID") REFERENCES cord.tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_assignees
    ADD CONSTRAINT "task_assignees_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_third_party_references
    ADD CONSTRAINT "task_third_party_references_taskID_fkey" FOREIGN KEY ("taskID") REFERENCES cord.tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_third_party_references
    ADD CONSTRAINT "task_third_party_references_taskTodoID_fkey" FOREIGN KEY ("taskTodoID") REFERENCES cord.task_todos(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_third_party_subscriptions
    ADD CONSTRAINT "task_third_party_subscriptions_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_third_party_subscriptions
    ADD CONSTRAINT "task_third_party_subscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_todos
    ADD CONSTRAINT "task_todos_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.task_todos
    ADD CONSTRAINT "task_todos_taskID_fkey" FOREIGN KEY ("taskID") REFERENCES cord.tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.tasks
    ADD CONSTRAINT "tasks_messageID_fkey" FOREIGN KEY ("messageID") REFERENCES cord.messages(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.tasks
    ADD CONSTRAINT "tasks_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.third_party_connections
    ADD CONSTRAINT "third_party_connections_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.third_party_connections
    ADD CONSTRAINT "third_party_connections_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.thread_participants
    ADD CONSTRAINT "thread_participants_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.thread_participants
    ADD CONSTRAINT "thread_participants_orgID_threadID_fkey" FOREIGN KEY ("orgID", "threadID") REFERENCES cord.threads("orgID", id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY cord.thread_participants
    ADD CONSTRAINT "thread_participants_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_orgID_fkey" FOREIGN KEY ("orgID") REFERENCES cord.orgs(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages("orgID", "contextHash") ON DELETE CASCADE;
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.threads
    ADD CONSTRAINT "threads_resolverUserID_fkey" FOREIGN KEY ("resolverUserID") REFERENCES cord.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY cord.user_hidden_annotations
    ADD CONSTRAINT "user_hidden_annotations_annotationID_fkey" FOREIGN KEY ("annotationID") REFERENCES cord.message_attachments(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.user_hidden_annotations
    ADD CONSTRAINT "user_hidden_annotations_orgID_pageContextHash_fkey" FOREIGN KEY ("orgID", "pageContextHash") REFERENCES cord.pages("orgID", "contextHash") ON DELETE CASCADE;
ALTER TABLE ONLY cord.user_hidden_annotations
    ADD CONSTRAINT "user_hidden_annotations_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.user_preferences
    ADD CONSTRAINT "user_preferences_userID_fkey" FOREIGN KEY ("userID") REFERENCES cord.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.users
    ADD CONSTRAINT "users_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
ALTER TABLE ONLY cord.warm_demo_users
    ADD CONSTRAINT "warm_demo_users_platformApplicationID_fkey" FOREIGN KEY ("platformApplicationID") REFERENCES cord.applications(id) ON DELETE CASCADE;
`;
const setup = `
CREATE OR REPLACE FUNCTION public.gen_random_uuid()
RETURNS uuid AS 'SELECT uuid_generate_v4();' LANGUAGE SQL;

SET search_path = cord, public;`;
