import addrs from 'email-addresses';
import isUUID from 'validator/lib/isUUID.js';
import replyParser from 'node-email-reply-parser';
import type { MessageContent, UUID } from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';

// Parses an email address such as "sponge@bob.com" or
// "Sponge Bob <sponge@bob.com>"
export function parseEmailAddress(emailAddress: string): addrs.ParsedMailbox {
  const parsedAddress = addrs
    .parseAddressList(emailAddress)
    ?.find((email): email is addrs.ParsedMailbox => email.type === 'mailbox');
  if (parsedAddress === undefined) {
    throw new Error(`failed to parse email address: ${emailAddress}`);
  }
  return parsedAddress;
}

/**
 * Takes a sender email address and a notification ID, and returns a reply-to
 * email address such that replies to that address will be appended to the
 * thread associated with the notification ID.
 */
export function getReplyToEmailAddress(
  logger: Logger,
  senderEmailAddress: string,
  notificationId: UUID,
): string {
  try {
    const parsedAddress = parseEmailAddress(senderEmailAddress);

    // Applications can use a white-label (non-@cord.fyi) sender email. That's
    // fine, but replies MUST come via cord.fyi; those emails get routed through
    // SendGrid, who call a webhook (search this repo for
    // SendGridWebhookHandler) so we can handle them and e.g. append reply
    // contents to the appropriate thread.
    const replyToAddress = `${parsedAddress.local}-${notificationId}@${parsedAddress.domain}`;
    if (parsedAddress.name) {
      return `${parsedAddress.name} <${replyToAddress}>`;
    }
    return replyToAddress;
  } catch (e) {
    logger.logException('failed to parse email address', e);
    return senderEmailAddress;
  }
}

// If email name ends with "-UUID" then it returns that UUID
export function extractCordEmailUUID(emailAddress: string): UUID | null {
  try {
    const parsedAddress = parseEmailAddress(emailAddress);
    const uuidLength = 36;
    // check that the address ends with a dash "-" and then 36 UUID characters
    if (
      parsedAddress.local.length < 1 + uuidLength ||
      parsedAddress.local.slice(-(1 + uuidLength))[0] !== '-'
    ) {
      return null;
    }
    const maybeUUID = parsedAddress.local.slice(-uuidLength);
    return isUUID.default(maybeUUID) ? maybeUUID : null;
  } catch (e) {
    anonymousLogger().logException(
      'failed to parse email address',
      e,
      {},
      undefined,
      'warn',
    );
    return null;
  }
}

export function emailTextToMessageContent(
  emailText: string,
  attachments: string,
): MessageContent {
  // Unlike Gmail, Mac Mail does not automatically add a standard email
  // signature separator like '--' at the begining of a signature block
  // so our library was not detecting it as such.
  // As a result, we were sending the signature as part of the reply message.

  // To overcome this, we break up the email content into fragments and
  // disregard anything that comes after the quoted text reply.
  // Unfortunately, this will still be an issue for users who add their
  // signatures above the quoted text and have no signature separator.
  const replyFragments = replyParser(emailText).getFragments();
  let replyBeforeQuotedText = '';
  for (const fragment of replyFragments) {
    if (fragment.isQuoted()) {
      break;
    }
    replyBeforeQuotedText += fragment.getContent();
  }

  let replyText = replyParser(replyBeforeQuotedText).getVisibleText({
    // from the docs of replyParser:
    // Using aggressive mode runs the risk of losing visible lines which are
    // interspersed with quoted lines, but is useful when parsing e.g. emails
    // from a 'reply by email' feature which contain a large block of quoted
    // text.
    aggressive: true,
  });

  if (Number(attachments) > 0) {
    replyText = replyText + `\n(Unable to display attached files)`;
  }

  return replyText
    .split(/\r?\n/)
    .filter((l) => l.length > 0)
    .map((line) => ({
      type: MessageNodeType.PARAGRAPH,
      children: [{ text: line }],
    }));
}

export async function getNotification(
  toAddress: string,
  inReplyToHeader: string | undefined,
  fromEmail: string,
  logger: Logger,
) {
  const notificationID = extractCordEmailUUID(toAddress);
  if (notificationID) {
    return await EmailOutboundNotificationEntity.findOne({
      where: { id: notificationID },
    });
  }

  if (inReplyToHeader) {
    // Some mail clients, like Hubspot, do not respect the Reply-To email header
    // and send their reply to the From header, which does not contain our notification
    // ID.  In that case, we can try and pull out the ID we set in the 'Message-ID'
    // header, which will now be the 'In-Reply-To' header in the incoming email
    // (see getThreadingHeaders fn: these are headers which are used to thread
    // messages nicely in email clients). This will either be the notification ID
    // or thread ID, depending on whether this was a first notification or not.
    // With the combination of the thread ID and the email this message came from,
    // we should be able to find the Notification.
    logger.debug(
      'Unable to find notificationId in toAddress, will try to find from inReplyTo header',
      {
        toAddress,
        inReplyToHeader,
        fromEmail,
      },
    );

    const threadOrNotificationID = extractCordEmailUUID(inReplyToHeader);

    // First see if the ID we found is a notification ID
    if (threadOrNotificationID) {
      const notification = await EmailOutboundNotificationEntity.findOne({
        where: { id: threadOrNotificationID },
      });
      if (notification) {
        return notification;
      }
    }

    let parsedFromEmail;

    try {
      const email = parseEmailAddress(fromEmail);
      parsedFromEmail = email.address;
    } catch (e: any) {
      logger.warn('Error parsing from email', e);
    }

    // If we're still here, it wasn't a notification ID (or the notification has
    // disappeared for some reason).  Assume it's a thread ID:
    if (threadOrNotificationID && parsedFromEmail) {
      return await EmailOutboundNotificationEntity.findOne({
        where: { threadID: threadOrNotificationID, email: parsedFromEmail },
      });
    }
  }

  return null;
}

function getHeader(key: string, input: string) {
  const pattern = new RegExp(`^${key}: (.+)$`, 'gm');
  const match = pattern.exec(input);

  return match?.[1];
}

export type RelevantHeaders =
  | Record<'messageID' | 'inReplyTo' | 'autoSubmitted', string | undefined>
  | undefined;

// We could use the mailparser npm package to do this but it would also require
// adding another library as middleware (https://github.com/nodemailer/mailparser/issues/253)
// and it didn't seem worth it for grabbing a couple of strings
// Add more headers you might expect to find if you need them!
export function parseRelevantHeaders(headersString: string): RelevantHeaders {
  // This is a specific ID for this incoming email and would be something like:
  // '<CACnco=B99bM4+YPHkUNqgPT8azMcYCROss2BdPgA7pAoqW8egw@mail.gmail.com>',
  const messageID = getHeader('Message-Id', headersString);
  // This should be the Message-ID we set on the original email notification, which
  // contains the threadID. See getThreadingHeaders.
  const inReplyTo = getHeader('In-Reply-To', headersString);
  // This is a header that should be set if a reply is automated, e.g. an OOO
  const autoSubmitted = getHeader('Auto-Submitted', headersString);

  return { messageID, inReplyTo, autoSubmitted };
}
