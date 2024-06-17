'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."admin_chat_channels"
          DROP CONSTRAINT "admin_chat_channels_name_key";

      ALTER TABLE "cord"."admin_chat_channels"
          DROP CONSTRAINT "admin_chat_channels_pkey";

      DROP INDEX IF EXISTS "cord"."admin_chat_channels_name_key";

      DROP INDEX IF EXISTS "cord"."admin_chat_channels_pkey";

      DROP TABLE "cord"."admin_chat_channels";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE "cord"."admin_chat_channels" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
          "name" text NOT NULL
      );

      CREATE UNIQUE INDEX admin_chat_channels_name_key ON cord.admin_chat_channels USING btree (name);

      CREATE UNIQUE INDEX admin_chat_channels_pkey ON cord.admin_chat_channels USING btree (id);

      ALTER TABLE "cord"."admin_chat_channels"
          ADD CONSTRAINT "admin_chat_channels_pkey" PRIMARY KEY USING INDEX "admin_chat_channels_pkey";

      ALTER TABLE "cord"."admin_chat_channels"
          ADD CONSTRAINT "admin_chat_channels_name_key" UNIQUE USING INDEX "admin_chat_channels_name_key";

      COMMIT;`),
};
