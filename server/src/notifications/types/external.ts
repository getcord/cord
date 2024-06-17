import { assert } from 'common/util/index.ts';
import type { SpecificNotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type {
  Notification,
  NotificationHeaderNode,
} from 'server/src/schema/resolverTypes.ts';

export async function buildExternalNotification(
  context: RequestContext,
  notif: SpecificNotificationEntity<'external'>,
): Promise<Notification> {
  assert(
    notif.recipientID === context.session.viewer.userID,
    'Viewer must be notif recipient',
  );

  if (notif.externalTemplate === null || notif.externalURL === null) {
    throw new Error('External notif must have template and URL');
  }

  const [sender, recipient] = await Promise.all([
    notif.senderID ? context.loaders.userLoader.loadUser(notif.senderID) : null,
    context.loaders.userLoader.loadUser(notif.recipientID),
  ]);

  if (recipient === null) {
    throw new Error('Unable to load recipient');
  }

  return {
    id: notif.id,
    externalID: notif.externalID,
    senders: sender ? [sender] : [],
    iconUrl: notif.iconUrl,
    header: externalHeader(notif.externalTemplate, sender, recipient),
    headerTranslationKey: null,
    headerSimpleTranslationParams: null,
    attachment: { url: notif.externalURL },
    readStatus: notif.readStatus,
    timestamp: notif.createdTimestamp,
    extraClassnames: notif.extraClassnames,
    metadata: notif.metadata,
  };
}

function externalHeader(
  template: string,
  sender: UserEntity | null,
  recipient: UserEntity,
) {
  // We need to split the template into literal parts and templated parts -- so
  // "{{actor}} ate a sandwich" becomes ["{{actor}}", " ate a sandwich"]. Use a
  // regexp with string.split to do that. Normally, string.split does not
  // include the matched characters in the result -- "hi test".split(" ")
  // results in ["hi", "test"] -- the space is lost. But we do want every
  // character of the input to appear in the split output somewhere, we just
  // want to use the regex to help tokenize.  It turns out that string.split
  // will implicitly insert any capturing groups into the result, so we can wrap
  // the whole regex in a capturing group to include the actual text that we
  // matched as part of the output. Any other groups therefore need to be
  // non-capturing.
  //
  // The regex thus represents:
  // - A capturing group around the whole thing
  // - Two braces "{{""
  // - Optionally followed by whitespace
  // - Followed by "actor" or "recipient" (using a non-capturing group)
  // - Optionally followed by whitespace
  // - Two braces "}}"
  const re = /({{ *(?:actor|recipient) *}})/;
  const result: NotificationHeaderNode[] = [];
  for (const segment of template.split(re)) {
    if (segment === '') {
      continue;
    } else if (segment.match(re) === null) {
      result.push({ text: segment, bold: false });
    } else if (sender && segment.includes('actor')) {
      result.push({ user: sender });
    } else if (segment.includes('recipient')) {
      result.push({ user: recipient });
    } else {
      throw new Error(`What did we match?! ${segment}`);
    }
  }

  return result;
}
