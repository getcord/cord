#!/usr/bin/env -S node --enable-source-maps

// This script inspects every message in the database that was sent within the
// past year and outputs the ones that fail validation.  This can be helpful in
// checking that new validation rules won't invalidate a bunch of messages that
// currently exist in the DB.

import 'dotenv/config.js';
import { Op } from 'sequelize';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { validateMessageContent } from 'server/src/message/util/validateMessageContent.ts';

const BATCH_SIZE = 100000;
const CHECK_START = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
})();

async function main() {
  await initSequelize('script');
  let errors = 0;
  let checked = 0;
  let messages: MessageEntity[] = [];
  do {
    messages = await MessageEntity.findAll({
      where: {
        timestamp: {
          [Op.gt]:
            messages.length > 0
              ? messages[messages.length - 1].timestamp
              : CHECK_START,
        },
      },
      order: [['timestamp', 'ASC']],
      limit: BATCH_SIZE,
    });
    for (const message of messages) {
      checked++;
      try {
        validateMessageContent(message.content);
      } catch {
        errors++;
        console.log(
          `Invalid content for message ${message.id}:\n${JSON.stringify(
            message.content,
            null,
            2,
          )}`,
        );
      }
    }
  } while (messages.length === BATCH_SIZE);
  console.log(`Total checked: ${checked}\nTotal errors: ${errors}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
