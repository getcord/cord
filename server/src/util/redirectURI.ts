import * as jwt from 'jsonwebtoken';
import type { Location } from 'common/types/index.ts';
import type { AuthProviderType } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

const CORD_REDIRECT_QUERY_PARAM = 'cord_notifications';

// If a User is included in Redirect data, it should look like this
// to pass the maximum amount of given data to the application
export type UserDetails = {
  userType: AuthProviderType | null;
  userID: string | null; // external user ID of the sharer or target. null if support bot
  orgID: string; // external org ID of the sharer or target
  groupID: string; // external group ID of the sharer or target
  name: string | null;
  email: string | null;
  profilePictureURL: string | null;
};

type SlackNoficationRedirect = {
  type: 'slack';
  messageID: string;
  targetDetails: UserDetails;
  sharerDetails: UserDetails;
  threadID: string;
  url: string;
  timestamp: Date;
};

type EmailNotificationRedirect = {
  type: 'email';
  messageID: string;
  targetDetails: UserDetails;
  sharerDetails: UserDetails;
  threadID: string;
  url: string;
  timestamp: Date;
};

type SharedToSlackNotificationRedirect = {
  type: 'sharedToSlackChannel';
  targetDetails: Pick<UserDetails, 'userType' | 'orgID' | 'groupID'> & {
    slackChannelID: string;
  };
  sharerDetails: UserDetails;
  threadID: string;
  url: string;
  timestamp: Date;
};

type SharedToEmailNotificationRedirect = {
  type: 'sharedToEmail';
  targetDetails: Pick<UserDetails, 'userType' | 'email'>;
  sharerDetails: UserDetails;
  threadID: string;
  url: string;
  timestamp: Date;
};

export type MessageNotificationDataByType = {
  slack: SlackNoficationRedirect;
  email: EmailNotificationRedirect;
  sharedToSlackChannel: SharedToSlackNotificationRedirect;
  sharedToEmail: SharedToEmailNotificationRedirect;
};

type InboxRedirect = {
  type: 'inbox';
  url: string;
  location: Location;
  threadID: string;
  userDetails: UserDetails;
};

type RedirectData =
  | SlackNoficationRedirect
  | EmailNotificationRedirect
  | SharedToSlackNotificationRedirect
  | SharedToEmailNotificationRedirect
  | InboxRedirect;

export async function applicationSupportsRedirect(
  platformApplicationID: string,
): Promise<boolean> {
  const application = await ApplicationEntity.findByPk(platformApplicationID);

  if (!application) {
    throw new Error('ApplicationEntity not found');
  }

  if (!application.redirectURI) {
    return false;
  }

  return true;
}

export async function generateSignedExternalRedirectURI(
  platformApplicationID: string | undefined,
  url: string,
  data: RedirectData,
): Promise<string> {
  return await generateSignedRedirectURIImplementation(
    platformApplicationID,
    url,
    data,
  );
}

async function generateSignedRedirectURIImplementation(
  platformApplicationID: string | undefined,
  url: string,
  data: RedirectData,
): Promise<string> {
  if (!platformApplicationID) {
    return url;
  }

  const application = await ApplicationEntity.findByPk(platformApplicationID);

  if (!application) {
    return url;
  }

  const redirectURI = application.redirectURI;
  if (!redirectURI) {
    return url;
  }

  const state = jwt.sign(
    {
      notificationInfo: {
        ...data,
      },
    },
    application.sharedSecret,
    { algorithm: 'HS256' },
  );

  const parsed = new URL(redirectURI);

  parsed.searchParams.set(CORD_REDIRECT_QUERY_PARAM, state);

  return parsed.href;
}
