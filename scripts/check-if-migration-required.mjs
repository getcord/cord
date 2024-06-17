#!/usr/bin/env node

// eslint-disable-next-line no-restricted-imports
import { getPendingMigrations } from './lib/migrate_db.mjs';

async function main() {
  const pendingMigrations = await getPendingMigrations();
  if (pendingMigrations.length) {
    console.log(`Pending migrations: ${pendingMigrations.join(', ')}`);
    return 2;
  }

  return 0;
}

main().then(
  (status) => {
    process.exit(status);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
