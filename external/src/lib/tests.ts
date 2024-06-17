import { v4 as uuidv4 } from 'uuid';
import type {
  UserFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { messageContentFromString } from '@cord-sdk/react/common/lib/messageNode.ts';

export const mockUser = (
  override: Partial<UserFragment> = {},
): UserFragment => ({
  id: uuidv4(),
  externalID: 'foobar',
  displayName: 'foobar',
  fullName: 'foo bar',
  name: 'foo bar',
  shortName: 'foobar',
  profilePictureURL: null,
  metadata: {},
  ...override,
});

export const mockMessage = (
  override: Partial<MessageFragment> = {},
): MessageFragment => ({
  __typename: 'Message',
  id: uuidv4(),
  externalID: 'mock-' + uuidv4(),
  source: mockUser(),
  content: messageContentFromString(''),
  url: '',
  seen: false,
  reactions: [],
  attachments: [],
  timestamp: new Date().toISOString(),
  deletedTimestamp: null,
  lastUpdatedTimestamp: null,
  importedFromSlackChannel: null,
  referencedUserData: [],
  task: null,
  importedSlackMessageType: null,
  slackURL: null,
  isFromEmailReply: false,
  type: 'user_message',
  iconURL: null,
  translationKey: null,
  metadata: {},
  extraClassnames: null,
  seenBy: [{ externalID: mockUser().externalID }],
  skipLinkPreviews: false,
  ...override,
});
