import * as sgMail from '@sendgrid/mail';
import * as jwt from 'jsonwebtoken';
import type { UUID } from 'common/types/index.ts';
import { LogLevel } from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ThreadDetails } from 'server/src/util/email.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import { getReplyToEmailAddress } from 'server/src/email/utils.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { DEFAULT_EMAIL_LOGO_WIDTH } from 'common/const/Sizes.ts';
import {
  AUTH0_CUSTOM_LOGIN_DOMAIN,
  CONSOLE_ORIGIN,
} from 'common/const/Urls.ts';
import { AUTH0_CLIENT_ID } from 'common/const/Ids.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import type { NotificationType } from 'server/src/entity/notification/NotificationEntity.ts';

sgMail.default.setApiKey(env.SENDGRID_API_KEY);
export const DEFAULT_MENTION_NOTIFICATION_V2_TEMPLATE_ID =
  'd-6309e6ccb36a4a769957795f475c8130';
export const MENTION_NOTIFICATION_NO_POWERED_BY_CORD_TEMPLATE_ID =
  'd-8a8088e59eed4622b2d09078de372fe8';
export const DEFAULT_SHARE_TO_EMAIL_TEMPLATE_ID =
  'd-fecc876acf684ff2bca887748d86e4e1';
export const SHARE_TO_EMAIL_NO_POWERED_BY_CORD_TEMPLATE_ID =
  'd-b70dc2c71ee541ee9e0c5f4cd84b32e3';
export const DEFAULT_THREAD_RESOLVE_TEMPLATE_ID =
  'd-93aa618e7d0b4ba593c346f9a1f664c5';
export const THREAD_RESOLVE_NO_POWERED_BY_CORD_TEMPLATE_ID =
  'd-37c14e17cc9649afb70495f029b3833d';
const SEND_CONSOLE_USER_INVITE_TEMPLATE_ID =
  'd-ab157e4f588c4a30b6304e4e062b5f88';
const ACCESS_GRANTED_TO_CONSOLE_USER_TEMPLATE_ID =
  'd-1bbf5f1a7a2948529de051d44eb873c9';
const ACCESS_DENIED_TO_CONSOLE_USER_TEMPLATE_ID =
  'd-48ea1b657a2a4f9b95c9f81d38425306';
const REQUEST_ACCESS_TO_CUSTOMER_TEMPLATE_ID =
  'd-bfe0627042f345f8b7877e6a97815359';

type UnsubscribeThreadTokenData = {
  threadID: UUID;
  userID: UUID;
  orgID: UUID;
  appID: UUID | null;
};

export type ActionIcon = 'mention' | 'task' | 'paperclip';

export const encodeUnsubscribeThreadToken = (
  data: UnsubscribeThreadTokenData,
) => jwt.sign(data, env.EMAIL_LINKS_TOKEN_SECRET, { algorithm: 'HS512' });

export const decodeUnsubscribeThreadToken = (token: string) =>
  jwt.verify(token, env.EMAIL_LINKS_TOKEN_SECRET, {
    algorithms: ['HS512'],
  }) as UnsubscribeThreadTokenData;

export type SendActionEmailNotificationData = {
  context: RequestContext;
  recipientEmail: string;
  actionText: string;
  actionIconType: ActionIcon;
  pageName: string;
  pageURL: string;
  providerName: string | undefined;
  unsubscribeURL: string;
  partnerDetails: CustomEmailTemplate | undefined;
  threadDetails: ThreadDetails;
  emailNotification: EmailOutboundNotificationEntity;
  /** You can edit templates in SendGrid */
  templateId: string;
  notificationType: NotificationType;
};
/*
  Common function used to send thread-action and reply notifications.
  They are similar in that they both notify of an action eg resolving
  /unresolving a thread or a reply or @mention message.
  */
export async function sendActionEmailNotification({
  context,
  recipientEmail,
  actionText,
  actionIconType,
  pageName,
  pageURL,
  providerName,
  unsubscribeURL,
  partnerDetails,
  threadDetails,
  emailNotification,
  /** You can edit templates in SendGrid */
  templateId,
  notificationType,
}: SendActionEmailNotificationData) {
  if (process.env.IS_TEST) {
    return;
  }

  const {
    firstMessageDetails,
    firstMessageUserDetails,
    previousMessageDetails,
    previousMessageUserDetails,
    currentMessageDetails,
    currentMessageUserDetails,
    messagesCountLeft,
  } = threadDetails;

  const threadingHeaders = await getThreadingHeaders(emailNotification);

  // See https://stackoverflow.com/questions/1027395/detecting-outlook-autoreply-out-of-office-emails#comment64988838_25324691
  // Request that MS Exchange does not send automated replies (like Out of Office)
  // back to this email
  const noAutoResponseHeader = { 'X-Auto-Response-Suppress': 'OOF' };

  const unsubscribeHeaders = {
    'List-Unsubscribe': `<${unsubscribeURL}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  let eventType = '';
  let emailType = '';
  if (notificationType === 'reply') {
    eventType = 'email-mention-notification-sent-v2';
    emailType = 'mention v2';
  } else if (notificationType === 'thread_action') {
    eventType = 'email-thread-action-notification-sent';
    emailType = 'thread action';
  }

  const mailData = {
    from: partnerDetails?.sender ?? 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    replyTo: getReplyToEmailAddress(
      context.logger,
      partnerDetails?.sender ?? `Cord <cord@cord.fyi>`,
      emailNotification.id,
    ),
    templateId,
    headers: {
      ...threadingHeaders,
      ...noAutoResponseHeader,
      ...unsubscribeHeaders,
    },
    dynamicTemplateData: {
      Action: actionText,
      Action_Icon: actionIconType,
      Page_Name: pageName,
      Page_URL: pageURL,
      Tool_Name: providerName,
      First_Message_Details: firstMessageDetails,
      First_Message_User_Details: firstMessageUserDetails,
      Previous_Message_Details: previousMessageDetails,
      Previous_Message_User_Details: previousMessageUserDetails,
      Current_Message_Details: currentMessageDetails,
      Current_Message_User_Details: currentMessageUserDetails,
      Messages_Count_Left: messagesCountLeft,
      Preview_Text: currentMessageDetails.message_preview,
      Unsubscribe_URL: unsubscribeURL,
      Partner_Name: partnerDetails?.partnerName,
      Partner_Image_URL: partnerDetails?.imageURL,
      Add_Explainer: false,
      Image_Height: partnerDetails?.logoConfig?.height ?? 'auto',
      Image_Width:
        partnerDetails?.logoConfig?.width ?? DEFAULT_EMAIL_LOGO_WIDTH,
    },
  };
  return await sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(`Sent ${emailType} email to ${recipientEmail}`);
      logServerEvent({
        session: context.session,
        type: eventType,
        logLevel: LogLevel.DEBUG,
        payload: { from: mailData.from, to: mailData.to },
      });

      return true;
    })
    .catch((error) => {
      context.logger.error(
        `Failed sending ${emailType} email to ${recipientEmail}`,
        {
          error: error.response.body.errors,
          from_address: mailData.from,
          to_address: mailData.to,
        },
      );
      return false;
    });
}

// the EmailEmail repetition is intentional
export function sendShareThreadToEmailEmail(
  context: RequestContext,
  recipientEmail: string,
  pageName: string,
  pageURL: string,
  partnerDetails: CustomEmailTemplate | undefined,
  threadDetails: ThreadDetails,
  emailNotification: EmailOutboundNotificationEntity | null,
  templateID: string,
) {
  if (process.env.IS_TEST) {
    return true;
  }

  const {
    senderName,
    firstMessageDetails,
    firstMessageUserDetails,
    previousMessageDetails,
    previousMessageUserDetails,
    currentMessageDetails,
    currentMessageUserDetails,
    messagesCountLeft,
  } = threadDetails;

  const mailData = {
    from: partnerDetails?.sender ?? 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    replyTo: emailNotification
      ? getReplyToEmailAddress(
          context.logger,
          partnerDetails?.sender ?? `Cord <cord@cord.fyi>`,
          emailNotification.id,
        )
      : partnerDetails?.sender ?? `Cord <cord@cord.fyi>`,
    templateId: templateID,
    dynamicTemplateData: {
      Page_Name: pageName,
      Page_URL: pageURL,
      Sender_Name: senderName,
      First_Message_Details: firstMessageDetails,
      First_Message_User_Details: firstMessageUserDetails,
      Previous_Message_Details: previousMessageDetails,
      Previous_Message_User_Details: previousMessageUserDetails,
      Current_Message_Details: currentMessageDetails,
      Current_Message_User_Details: currentMessageUserDetails,
      Messages_Count_Left: messagesCountLeft,
      Preview_Text: currentMessageDetails.message_preview,
      Partner_Name: partnerDetails?.partnerName,
      Partner_Image_URL: partnerDetails?.imageURL,
      Image_Height: partnerDetails?.logoConfig?.height ?? 'auto',
      Image_Width:
        partnerDetails?.logoConfig?.width ?? DEFAULT_EMAIL_LOGO_WIDTH,
    },
  };
  return sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(`Sent shareThreadToEmail email to ${recipientEmail}`);
      logServerEvent({
        session: context.session,
        type: 'email-share-thread-to-email-sent',
        logLevel: LogLevel.DEBUG,
        payload: { from: mailData.from, to: mailData.to },
      });

      return true;
    })
    .catch((error) => {
      context.logger.error(
        `Failed sending shareThreadToEmail email to ${recipientEmail}`,
        {
          error: error.response.body.errors,
        },
      );
      return false;
    });
}

type ThreadingHeaders =
  | {
      'Message-ID': string;
    }
  | {
      'Message-ID': string;
      'In-Reply-To': string;
      References: string;
    };
// Returns the email headers Message-ID, In-Reply-To and References to enable
// threading of emails (in the email client) for the same Cord thread.
// We also use these headers when handling inbound replies in SendGridWebhookHandler
// if the notificationID is not in the 'to' address.
async function getThreadingHeaders(
  emailNotification: EmailOutboundNotificationEntity,
): Promise<ThreadingHeaders> {
  const isFirstEmail =
    (await EmailOutboundNotificationEntity.count({
      where: {
        email: emailNotification.email,
        threadID: emailNotification.threadID,
      },
    })) === 1;

  if (isFirstEmail) {
    return {
      'Message-ID': `<thread-${emailNotification.threadID}@cord.fyi>`,
    };
  } else {
    return {
      'Message-ID': `<notif-${emailNotification.id}@cord.fyi>`,
      'In-Reply-To': `<thread-${emailNotification.threadID}@cord.fyi>`,
      References: `<thread-${emailNotification.threadID}@cord.fyi>`,
    };
  }
}

export async function sendEmailInviteConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  inviterName: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const customer = await CustomerEntity.findByPk(customerID);

  if (!customer) {
    throw new Error('No customer, no customer invite!');
  }

  const inviteLink = encodeURI(
    `https://${AUTH0_CUSTOM_LOGIN_DOMAIN}/authorize?` +
      'response_type=code&' +
      `client_id=${AUTH0_CLIENT_ID}&` +
      `redirect_uri=${CONSOLE_ORIGIN}/login&` +
      'scope=openid email profile&' +
      'screen_hint=signup&' +
      `login_hint=${recipientEmail}`,
  );

  const mailData = {
    from: 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    templateId: SEND_CONSOLE_USER_INVITE_TEMPLATE_ID,
    dynamicTemplateData: {
      Invite_Link: inviteLink,
      Inviter: inviterName,
      Customer_Name: customer.name,
    },
  };
  return await sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(
        `Sent email to invite ${recipientEmail} to cord console`,
      );
      logServerEvent({
        session: context.session,
        type: 'email-invite-console-user',
        logLevel: LogLevel.DEBUG,
        payload: { from: mailData.from, to: mailData.to },
      });

      return true;
    })
    .catch((error) => {
      context.logger.error(`Failed sending email to ${recipientEmail}`, {
        error: error.response.body.errors,
        from_address: mailData.from,
        to_address: mailData.to,
      });
      return false;
    });
}

export async function sendAccessGrantedEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  customer: CustomerEntity,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const mailData = {
    from: 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    templateId: ACCESS_GRANTED_TO_CONSOLE_USER_TEMPLATE_ID,
    dynamicTemplateData: {
      Console_Link: `${CONSOLE_ORIGIN}/login`,
      Customer_Name: customer.name,
    },
  };
  return await sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(
        `Sent email to ${recipientEmail} to notify access granted to customer in cord console`,
      );
      logServerEvent({
        session: context.session,
        type: 'email-granted-access-console-user',
        logLevel: LogLevel.DEBUG,
        payload: {
          from: mailData.from,
          to: mailData.to,
          customerID: customer.id,
        },
      });

      return true;
    })
    .catch((error) => {
      context.logger.error(`Failed sending email to ${recipientEmail}`, {
        error: error.response.body.errors,
        from_address: mailData.from,
        to_address: mailData.to,
      });
      return false;
    });
}

export async function sendAccessDeniedEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  customer: CustomerEntity,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const mailData = {
    from: 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    templateId: ACCESS_DENIED_TO_CONSOLE_USER_TEMPLATE_ID,
    dynamicTemplateData: {
      Console_Link: `${CONSOLE_ORIGIN}/login?newcustomer=true`,
      Customer_Name: customer.name,
    },
  };

  return await sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(
        `Sent email to ${recipientEmail} to notify access denied to customer in cord console`,
      );
      logServerEvent({
        session: context.session,
        type: 'email-denied-access-console-user',
        logLevel: LogLevel.DEBUG,
        payload: {
          from: mailData.from,
          to: mailData.to,
          customerID: customer.id,
        },
      });
      return true;
    })
    .catch((error) => {
      context.logger.error(`Failed sending email to ${recipientEmail}`, {
        error: error.response.body.errors,
        from_address: mailData.from,
        to_address: mailData.to,
      });
      return false;
    });
}

/**
 * Used for when a console user requests access to an existing customer
 */
async function sendRequestAccessEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  requesterEmail: string,
  customerName: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const mailData = {
    from: 'Cord <cord@cord.fyi>',
    to: recipientEmail,
    templateId: REQUEST_ACCESS_TO_CUSTOMER_TEMPLATE_ID,
    dynamicTemplateData: {
      Sender_Email: requesterEmail,
      Customer_Name: customerName,
      View_Access_Requests_Link: `${CONSOLE_ORIGIN}/usermanagement`,
    },
  };

  return await sgMail.default
    .send(mailData)
    .then(() => {
      context.logger.info(
        `Sent request access email to ${recipientEmail} to cord console`,
      );
      logServerEvent({
        session: context.session,
        type: 'email-request-access-customer',
        logLevel: LogLevel.DEBUG,
        payload: { from: mailData.from, to: mailData.to, customerID },
      });

      return true;
    })
    .catch((error) => {
      context.logger.error(`Failed sending email to ${recipientEmail}`, {
        error: error.response.body.errors,
        from_address: mailData.from,
        to_address: mailData.to,
      });
      return false;
    });
}

export async function sendAccessRequestToCustomerConsoleUsers(
  context: RequestContext,
  requesterEmail: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const customer = await CustomerEntity.findByPk(customerID);

  if (!customer) {
    throw new Error('No customer, no customer invite!');
  }
  const approvedCustomerConsoleUsers =
    await context.loaders.consoleUserLoader.loadConsoleUsersForCustomer(
      customerID,
    );

  if (approvedCustomerConsoleUsers.length === 0) {
    throw new Error('No console users in this customer');
  }

  return await Promise.all(
    approvedCustomerConsoleUsers.map((consoleUser) =>
      sendRequestAccessEmailToConsoleUser(
        context,
        consoleUser.email,
        requesterEmail,
        customer.name,
        customer.id,
      ),
    ),
  );
}
