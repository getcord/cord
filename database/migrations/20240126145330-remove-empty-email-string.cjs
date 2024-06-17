'use strict';

module.exports = {
  up: (queryInterface) =>
    queryInterface.sequelize.query(`
      BEGIN;

      UPDATE "cord"."users" SET email = NULL WHERE email = '';

      COMMIT;`),
  down: (queryInterface) =>
    // do nothing
    queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;`),
};
