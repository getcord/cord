import type { MessageContent, UUID } from 'common/types/index.ts';
import { slackMrkdwnFromMessageContentImpl } from 'server/src/slack/mrkdwnImpl.ts';
export { mrkdwnEscapeText } from 'server/src/slack/mrkdwnImpl.ts';

export async function slackMrkdwnFromMessageContent(
  content: MessageContent,
  lookUpSlackUserID: (userID: UUID) => Promise<string | null>,
): Promise<string> {
  return await slackMrkdwnFromMessageContentImpl(content, {
    lookUpSlackUserID,
  });
}
