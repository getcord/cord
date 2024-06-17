import { encode } from 'html-entities';
import type { MessageNode, MessageTextNode } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import {
  DEFAULT_MENTION_NOTIFICATION_V2_TEMPLATE_ID,
  DEFAULT_SHARE_TO_EMAIL_TEMPLATE_ID,
  DEFAULT_THREAD_RESOLVE_TEMPLATE_ID,
  MENTION_NOTIFICATION_NO_POWERED_BY_CORD_TEMPLATE_ID,
  SHARE_TO_EMAIL_NO_POWERED_BY_CORD_TEMPLATE_ID,
  THREAD_RESOLVE_NO_POWERED_BY_CORD_TEMPLATE_ID,
} from 'server/src/email/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import {
  getTypedFeatureFlagValue,
  FeatureFlags,
} from 'server/src/featureflags/index.ts';

function textNodeToHtml(node: MessageTextNode): string {
  let before = '';
  let after = '';
  if (node.bold) {
    before += '<strong>';
    after += '</strong>';
  }
  if (node.italic) {
    before = '<em>' + before;
    after += '</em>';
  }
  if (node.underline) {
    before = '<u>' + before;
    after += '</u>';
  }
  return before + encode(node.text) + after;
}

function convertNodeToHtml(node: MessageNode): string {
  if (node.type === undefined) {
    return textNodeToHtml(node);
  } else {
    switch (node.type) {
      case MessageNodeType.LINK:
        return `<a href="${encodeURI(node.url)}">${encode(
          (node.children[0] as MessageTextNode).text,
        )}</a>`;
      case MessageNodeType.PARAGRAPH:
        return `<p>${convertNodeListToEmailHtml(node.children)}</p>`;

      case MessageNodeType.TODO:
      case MessageNodeType.BULLET:
      case MessageNodeType.NUMBER_BULLET:
        return `<li>${convertNodeListToEmailHtml(node.children)}</li>`;
      case MessageNodeType.ASSIGNEE:
      case MessageNodeType.MENTION:
        return `<strong>${encode(
          (node.children[0] as MessageTextNode).text,
        )}</strong>`;
      case MessageNodeType.QUOTE:
        return `<blockquote style="border-left: 1px solid ${
          Colors.GREY_LIGHT
        };padding-left: ${Sizes.MEDIUM}px;">${convertNodeListToEmailHtml(
          node.children,
        )}</blockquote>`;

      case MessageNodeType.CODE:
        return `<code>${convertNodeListToEmailHtml(node.children)}</code>`;
      case MessageNodeType.MARKDOWN:
        // TODO: MARKDOWN_NODE strip markdown to plaintext
        return convertNodeListToEmailHtml(node.children);
    }
  }
}

// for email HTML we need to set a container around lists so it renders properly.
// https://perishablepress.com/css-center-align-list-left-align-text/
export function convertNodeListToEmailHtml(nodes: MessageNode[]) {
  let html = '';
  let unorderedListStarted = false;
  let orderedListStarted = false;

  // convert all nodes to html, but wrap consecutive sequences of <li> items
  // with <ol></ol> or <ul></ul>
  for (const node of nodes) {
    const nodeHtml = convertNodeToHtml(node);

    const isOrderedItem = node.type === MessageNodeType.NUMBER_BULLET;
    const isUnorderedItem =
      node.type === MessageNodeType.BULLET ||
      node.type === MessageNodeType.TODO;

    // end of ordered list
    if (!isOrderedItem && orderedListStarted) {
      orderedListStarted = false;
      html += '</ol></div>';
    }
    // end of unorderedList
    if (!isUnorderedItem && unorderedListStarted) {
      unorderedListStarted = false;
      html += '</ul></div>';
    }

    // start of ordered list
    if (isOrderedItem && !orderedListStarted) {
      orderedListStarted = true;
      html += '<div><ol>';
    }
    // start of unorderedList
    if (isUnorderedItem && !unorderedListStarted) {
      unorderedListStarted = true;
      html += '<div><ul>';
    }

    html += nodeHtml;
  }

  if (unorderedListStarted) {
    html += '</ul></div>';
  }

  if (orderedListStarted) {
    html += '</ol></div>';
  }

  return html;
}

// This maps to the three different notification template types we have for
// each custom variation in launch darkly
type NotificationActionType = 'thread_resolve' | 'share_to_email' | 'mention';
// To decide which email template to use look at feature flag and customer
// pricing tier; pro and scale should never show 'Powered by Cord'.
export async function getTemplateIDForNotification({
  notificationActionType,
  context,
  featureFlagUser,
}: {
  notificationActionType: NotificationActionType;
  context: RequestContext;
  featureFlagUser: FlagsUser;
}): Promise<string> {
  const customer = context.application?.customerID
    ? await context.loaders.customerLoader.load(context.application.customerID)
    : null;
  const tier = customer?.pricingTier;

  // Grab the template ID in LD for the current user (some users have some custom rules)
  const featureFlagTemplateIDs = await getTypedFeatureFlagValue(
    FeatureFlags.EMAIL_NOTIFICATION_TEMPLATE_ID,
    featureFlagUser,
  );
  const featureFlagTemplateID = featureFlagTemplateIDs[notificationActionType];
  const defaultTemplateID = getDefaultTemplateIDForNotificationType(
    notificationActionType,
  );

  // if a templateID is set distinct from the default, use it
  if (featureFlagTemplateID !== defaultTemplateID) {
    return featureFlagTemplateID;
  }

  // If the customer is on a paying tier, use the one without 'Powered by Cord' section
  if (tier === 'pro' || tier === 'scale') {
    return getPayingCustomerTemplateIDForNotificationType(
      notificationActionType,
    );
  }

  return defaultTemplateID;
}

function getDefaultTemplateIDForNotificationType(
  notificationActionType: NotificationActionType,
) {
  switch (notificationActionType) {
    case 'mention':
      return DEFAULT_MENTION_NOTIFICATION_V2_TEMPLATE_ID;
    case 'thread_resolve':
      return DEFAULT_THREAD_RESOLVE_TEMPLATE_ID;
    case 'share_to_email':
      return DEFAULT_SHARE_TO_EMAIL_TEMPLATE_ID;
    default: {
      const _: never = notificationActionType;
      throw new Error(
        'Could not find a template ID for notification action type: ' +
          notificationActionType,
      );
    }
  }
}
function getPayingCustomerTemplateIDForNotificationType(
  notificationActionType: NotificationActionType,
) {
  switch (notificationActionType) {
    case 'mention':
      return MENTION_NOTIFICATION_NO_POWERED_BY_CORD_TEMPLATE_ID;
    case 'thread_resolve':
      return THREAD_RESOLVE_NO_POWERED_BY_CORD_TEMPLATE_ID;
    case 'share_to_email':
      return SHARE_TO_EMAIL_NO_POWERED_BY_CORD_TEMPLATE_ID;
    default: {
      const _: never = notificationActionType;
      throw new Error(
        'Could not find paying customer template ID for notification action type: ' +
          notificationActionType,
      );
    }
  }
}
