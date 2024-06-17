import type { Request } from 'express';
import { v4 as uuid } from 'uuid';
import { CORD_HOMEPAGE_APPLICATION_ID } from 'common/const/Ids.ts';
import {
  createPlatformUser,
  findOrCreatePlatformOrganization,
  updatePlatformOrganizationMembers,
} from 'server/src/public/routes/platform/util.ts';
import type { DemoUser } from 'server/src/public/routes/warm-demo-users/types.ts';
import { createThreadMessage } from 'server/src/public/routes/platform/messages/CreateThreadMessageHandler.ts';
import { MessageNodeType } from 'common/types/index.ts';
import type { MessageContent } from 'common/types/index.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { ipToLocation } from 'docs/lib/geoip/geoip.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishUserIdentityUpdate } from 'server/src/pubsub/index.ts';

const defaultMessage = [
  {
    type: 'p',
    children: [
      {
        text: 'Oh, and comments! Like this. Go on, give it a try by replying 👇',
      },
    ],
  },
];

const altMessage1 = [
  {
    type: 'p',
    children: [
      {
        text: "With Cord's SDK, you can add these features (and more) to your product in just a few lines of code",
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: 'Seriously.' }],
  },
];

const altMessage2 = [
  {
    type: 'p',
    children: [
      {
        text: 'Ya know, with features that make it easier for people to collaborate',
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: 'Things like:' }],
  },
  {
    type: 'bullet',
    children: [{ type: 'p', children: [{ text: 'Comments' }] }],
  },
  {
    type: 'bullet',
    children: [{ type: 'p', children: [{ text: 'Live chat' }] }],
  },
  {
    type: 'bullet',
    children: [{ type: 'p', children: [{ text: 'Notifications' }] }],
  },
];

const MESSAGES: [string, MessageContent][] = [
  ['default', defaultMessage as MessageContent],
  ['alt1', altMessage1 as MessageContent],
  ['alt2', altMessage2 as MessageContent],
];

export async function create(): Promise<DemoUser> {
  const baseValue = uuid();
  const userID = baseValue + ':user';
  const orgID = baseValue + ':org';
  const threadID = baseValue + ':thread';

  const user = await createPlatformUser(
    null,
    CORD_HOMEPAGE_APPLICATION_ID,
    userID,
    null,
    'You',
    null,
    null,
    'active',
    null,
    null,
  );
  const [[org], [all]] = await Promise.all([
    findOrCreatePlatformOrganization(
      CORD_HOMEPAGE_APPLICATION_ID,
      orgID,
      'Your Org',
      'active',
    ),
    findOrCreatePlatformOrganization(
      CORD_HOMEPAGE_APPLICATION_ID,
      'all',
      'all',
      'active',
    ),
  ]);
  await Promise.all([
    // These users are created by scripts/homepage-create-users.sh and should
    // always be present.
    updatePlatformOrganizationMembers(org, [
      userID,
      'sam',
      'nimrod',
      'khadija',
      'myhoa',
      'tom',
      'zora',
    ]),
    OrgMembersEntity.create({
      userID: user.id,
      orgID: all.id,
    }),
  ]);
  await Promise.all(
    MESSAGES.map(([id, message]) =>
      createThreadMessage({
        platformApplicationID: CORD_HOMEPAGE_APPLICATION_ID,
        threadID: threadID + '-' + id,
        internalMessageID: uuid(),
        authorID: 'zora',
        content: message,
        addReactions: [
          {
            userID: 'tom',
            reaction: '👍',
          },
          {
            userID: 'myhoa',
            reaction: '👍',
          },
          {
            userID: 'tom',
            reaction: '❤️',
          },
          {
            userID: 'myhoa',
            reaction: '❤️',
          },
          {
            userID: 'khadija',
            reaction: '❤️',
          },
          {
            userID: 'sam',
            reaction: '❤️',
          },
          {
            userID: 'nimrod',
            reaction: '❤️',
          },
        ],
        createThread: {
          name: 'Hello',
          url: 'https://v5.cord.com/',
          organizationID: orgID,
          groupID: orgID,
          location: {
            page: 'homepage',
          },
        },
      }),
    ),
  );

  await createThreadMessage({
    platformApplicationID: CORD_HOMEPAGE_APPLICATION_ID,
    threadID: threadID + '-other',
    internalMessageID: uuid(),
    authorID: 'myhoa',
    content: [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'To see more of Cord, ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: userID },
            children: [{ text: '@You' }],
          },
          { text: ' should check out our ' },
          {
            type: MessageNodeType.LINK,
            url: 'https://v5.cord.com/demos',
            children: [{ text: 'demos' }],
          },
          { text: '!' },
        ],
      },
    ],
    createThread: {
      name: 'Demos',
      url: 'https://v5.cord.com/demos',
      organizationID: orgID,
      groupID: orgID,
      location: {
        page: 'demos',
      },
    },
  });

  return {
    appID: CORD_HOMEPAGE_APPLICATION_ID,
    userID,
    orgID,
  };
}

async function lookupGeoipIntoMetadata(req: Request, demoUser: DemoUser) {
  try {
    const [geoip, user] = await Promise.all([
      ipToLocation(req.ip),
      UserEntity.findOne({
        where: {
          externalID: demoUser.userID,
          platformApplicationID: demoUser.appID,
        },
      }),
    ]);

    if (user && geoip !== req.ip) {
      await Promise.all([
        user.update({ metadata: { geoip } }),
        publishUserIdentityUpdate({
          userID: user.id,
          platformApplicationID: demoUser.appID,
        }),
      ]);
    }
  } catch (e) {
    anonymousLogger().logException(
      `HomepageDemoUser failed to geoip ${req.ip}`,
      e,
    );
  }
}

export async function reheat(
  req: Request,
  user: DemoUser,
  token: string,
): Promise<object> {
  const baseValue = user.userID.substring(0, user.userID.indexOf(':'));

  // Doing a GeoIP lookup requires calling an external API. We don't want to
  // wait on that before showing demos on the homepage (want that to be as fast
  // as possible!) so don't wait on it. The frontend can fill in a default value
  // if it wins the race.
  backgroundPromise(lookupGeoipIntoMetadata(req, user));

  return {
    token,
    baseValue,
  };
}

export const numToKeep = 10;
export const version = 3;
