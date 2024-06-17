import {
  getMigrator,
  ensureCurrentMetaSchema,
} from 'sequelize-cli/lib/core/migrator.js';
import api from 'sequelize-cli/lib/helpers/config-helper.js';

export async function getPendingMigrations() {
  await api.init();
  const migrator = await getMigrator('migration', {});
  ensureCurrentMetaSchema(migrator);
  return (await migrator.pending()).map(({ file }) => file);
}
