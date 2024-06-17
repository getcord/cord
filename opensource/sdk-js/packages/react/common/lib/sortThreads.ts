import type { SortBy, ThreadSummary } from '@cord-sdk/types';

export function sortThreads(threads: ThreadSummary[], sortBy: SortBy) {
  switch (sortBy) {
    case 'first_message_timestamp': {
      return threads.sort(
        (a, b) =>
          (b.firstMessage?.createdTimestamp.getTime() ?? 0) -
          (a.firstMessage?.createdTimestamp.getTime() ?? 0),
      );
    }
    case 'most_recent_message_timestamp': {
      return threads.sort(
        (a, b) =>
          (b.lastMessage?.createdTimestamp.getTime() ?? 0) -
          (a.lastMessage?.createdTimestamp.getTime() ?? 0),
      );
    }
    default: {
      const _: never = sortBy;
    }
  }

  return threads;
}
