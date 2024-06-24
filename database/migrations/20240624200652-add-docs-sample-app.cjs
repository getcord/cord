'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;
INSERT INTO "cord"."applications"("id", "name", "sharedSecret", "type", "createdTimestamp", "customerID", "environment", "slackConnectAllOrgs", "enableEmailNotifications") VALUES('aeb2797f-f0a3-485c-a317-4986e2c8343b', 'Sample Docs', 'docs-dummy-pw', 'free', '2022-09-29 10:01:34.854528+00', '12ed6251-28d5-4686-9a75-20a15bd31499', 'production', 'FALSE', FALSE) RETURNING "id", "name", "sharedSecret", "customColors", "customEmailTemplate", "customLinks", "customS3Bucket", "segmentWriteKey", "customNUX", "iconURL", "type", "supportBotID", "supportOrgID", "supportSlackChannelID", "defaultProvider", "redirectURI", "createdTimestamp", "customerID", "environment", "slackConnectAllOrgs", "eventWebhookURL", "eventWebhookSubscriptions", "customSlackAppDetails", "customSlackAppID", "enableEmailNotifications";
      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;
        DELETE FROM cord.applications WHERE id = 'aeb2797f-f0a3-485c-a317-4986e2c8343b';
      COMMIT;`),
};
