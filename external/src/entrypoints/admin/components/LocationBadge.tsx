import { thread } from '@cord-sdk/react';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

export function LocationBadge({ issue }: { issue: string }) {
  const threadData = thread.useThread(issue);
  if (!threadData) {
    return null;
  }
  if (threadData?.thread?.unread) {
    return (
      <Text2 color="notification" center={true}>
        {threadData.thread.unread}
      </Text2>
    );
  }
  return null;
}
