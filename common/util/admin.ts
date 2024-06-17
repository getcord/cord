export const sortAndConcatenateWithPlus = (user1: string, user2: string) =>
  [user1, user2].sort().join('+');

// Slack Channel ID lives in common/consts/Ids.ts
export const CORD_UPDATES_SLACK_CHANNEL_DETAILS = {
  id: 'cord-updates-test',
  name: 'Cord Updates Test',
  slackChannelName: 'cord-updates-test',
};
