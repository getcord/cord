'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      UPDATE messages
        SET content = jsonb_set('[{"type":"p","children":[]}]'::jsonb, '{0,children}', content #- '{0, type}')
        WHERE jsonb_array_length(content) = 1 AND content->0->'type' = '"markdown"';

      COMMIT;`),
  down: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      -- No going back.

      COMMIT;`),
};
