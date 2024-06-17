#!/usr/bin/env -S node --enable-source-maps

import type { CreationAttributes } from 'sequelize';
import { v4 as uuid } from 'uuid';
import 'dotenv/config.js';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { initSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { messageContentFromString } from '@cord-sdk/react/common/lib/messageNode.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { initPubSub } from 'server/src/pubsub/index.ts';

function makeMessage(
  n: number,
  templateMessage: MessageEntity,
): CreationAttributes<MessageEntity> {
  return {
    id: uuid(),
    platformApplicationID: templateMessage.platformApplicationID,
    orgID: templateMessage.orgID,
    threadID: templateMessage.threadID,
    sourceID: templateMessage.sourceID,
    content: messageContentFromString(`llama ${n}`),
    url: templateMessage.url,
    extraClassnames: '',
  };
}

/**
 * This script spams a thread with a ton of messages, templated from the first
 * message in the thread but with the content replaced. Call the script with the
 * internal UUID of the thread to spam and how many messages you want to spam
 * with.
 */
async function main() {
  await initSequelize('script');
  await initPubSub();

  // argv[0] is node and argv[1] is this script name.
  if (process.argv.length !== 4) {
    throw new Error('Usage: spam_thread.js thread-uuid num-messages');
  }

  const n = parseInt(process.argv[3], 10);
  if (!(n > 0)) {
    throw new Error('Invalid num-messages');
  }

  const threadID = process.argv[2];
  const thread = await ThreadEntity.findByPk(threadID);
  if (!thread) {
    throw new Error('Could not find thread');
  }

  const firstMessage = await MessageEntity.findOne({
    where: { threadID },
    order: [['timestamp', 'ASC']],
  });
  if (!firstMessage) {
    throw new Error('Could not find first message in thread');
  }

  for (let i = 0; i < n; i++) {
    // Create them serially so that they don't all end up with the same
    // timestamp. It's a bit slower, but still quite tolerable against a local
    // DB.
    await MessageEntity.create(makeMessage(i + 1, firstMessage));
    if (i > 0 && i % 1000 === 0) {
      console.log(`${i}...`);
    }
  }

  // This would normally happen automatically when you send a message. Prevent
  // the original author from seeing a zillion new messages and killing the
  // page. (If you want to test that case, you can always use a second user.)
  await new ThreadParticipantMutator(
    Viewer.createLoggedInViewer(firstMessage.sourceID, firstMessage.orgID),
    null,
  ).markThreadSeen({ threadID });

  console.log('Done.');
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
