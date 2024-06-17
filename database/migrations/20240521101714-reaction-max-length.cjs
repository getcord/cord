'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."message_reactions"
          ADD CONSTRAINT "message_reactions_unicodeReaction_check" CHECK ((length("unicodeReaction") < 4096)) NOT valid;

      ALTER TABLE "cord"."message_reactions" validate CONSTRAINT "message_reactions_unicodeReaction_check";

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "cord"."message_reactions"
          DROP CONSTRAINT "message_reactions_unicodeReaction_check";

      COMMIT;`),
};
