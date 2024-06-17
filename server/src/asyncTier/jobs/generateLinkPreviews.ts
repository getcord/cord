import axios from 'axios';
import { load as cheerioLoad } from 'cheerio';
import * as linkify from 'linkifyjs';
import type { MessageContent, UUID } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { MessageNodeType } from '@cord-sdk/types';
import type { MessageNode } from '@cord-sdk/types';
import type { MessageLinkPreview } from 'server/src/schema/resolverTypes.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { MessageLinkPreviewMutator } from 'server/src/entity/message_link_preview/MessageLinkPreviewMutator.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import { isDefined } from 'common/util/index.ts';
import { manageConnection } from 'server/src/util/third_party/ssrf-req-filter.mjs';

export default new AsyncTierJobDefinition(
  'generateLinkPreviews',
  generateLinkPreviews,
);

const REQUEST_TIMEOUT = 5000;

type generateLinkPreviewsArgs = {
  messageID: UUID;
};

async function generateLinkPreviews(
  data: generateLinkPreviewsArgs,
  logger: Logger,
) {
  logger.info('Starting Generate Link Previews sync');
  const { messageID } = data;

  try {
    const message = await MessageEntity.findOne({ where: { id: messageID } });

    if (!message) {
      logger.warn(
        `Could not generate link previews for message. Cannot load message ${messageID}`,
      );
      return;
    }

    const existingPreviews = await MessageLinkPreviewEntity.findAll({
      where: { messageID: messageID },
    });

    const links = Array.from(getLinksForMessage(message.content)) ?? [];

    await Promise.all([
      addLinks(messageID, existingPreviews, links),
      removeLinks(existingPreviews, links),
    ]);

    backgroundPromise(
      publishPubSubEvent(
        'thread-message-updated',
        { threadID: message.threadID },
        { messageID },
      ),
    );
  } catch (error: unknown) {
    logger.logException('Error generationg link previews', error, {
      messageID,
    });
  }
}

function findLinks(node: MessageNode): Set<string> {
  const links: Set<string> = new Set();

  if (node.type === MessageNodeType.LINK) {
    links.add(node.url);
    return links;
  } else if (!node.type && node.type !== MessageNodeType.MENTION) {
    const urls = linkify.find(node.text);

    if (urls) {
      for (const url of urls) {
        if (url.type === 'url') {
          links.add(url.href);
        }
      }
    }
  }

  if ('children' in node && node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const childrenLinks = findLinks(node.children[i]);
      for (const childrenLink of childrenLinks) {
        links.add(childrenLink);
      }
    }
  }

  return links;
}

export async function getPreviewForURL(
  url: string,
): Promise<Omit<MessageLinkPreview, 'id' | 'hidden'> | null> {
  let previewURL = url;
  if (!previewURL.startsWith('http')) {
    previewURL = 'http://' + previewURL;
  }

  try {
    const { data } = await axios.get(previewURL, {
      timeout: REQUEST_TIMEOUT,
      httpAgent: manageConnection(previewURL),
      httpsAgent: manageConnection(previewURL),
    });
    const loadedWebsite = cheerioLoad(data);

    const getMetaTag = (name: string) => {
      return (
        loadedWebsite(`meta[name=${name}]`).attr('content') ||
        loadedWebsite(`meta[propety="twitter${name}"]`).attr('content') ||
        loadedWebsite(`meta[property="og:${name}"]`).attr('content')
      );
    };

    let previewImage = getMetaTag('image');
    if (previewImage && previewImage.length > 0) {
      if (previewImage[0] === '/') {
        previewImage = new URL(previewURL).origin + previewImage;
      }
      if (!previewImage.startsWith('http')) {
        previewImage = 'https://' + previewImage;
      }
    }

    return {
      title:
        getMetaTag('title') ??
        loadedWebsite('title').first().text() ??
        getMetaTag('site_name'),
      description: getMetaTag('description'),
      url: previewURL,
      img: previewImage,
    };
  } catch (e) {
    anonymousLogger().logException(
      'MessageLinkPreview error',
      e,
      undefined,
      undefined,
      'info',
    );
    return null;
  }
}

export function getLinksForMessage(content: MessageContent) {
  const allLinks = new Set<string>();
  for (const node of content) {
    const newLinks = findLinks(node);
    for (const link of newLinks) {
      allLinks.add(link);
    }
  }
  return allLinks;
}

async function addLinks(
  messageID: string,
  existingPreviews: MessageLinkPreviewEntity[],
  links: string[],
) {
  const newLinks = links?.filter((link) => {
    return !existingPreviews.find((preview) => preview.url === link);
  });

  const previews = await Promise.all(newLinks.map(getPreviewForURL));

  const viewer = Viewer.createServiceViewer();
  const messageLinkPreviewMutator = new MessageLinkPreviewMutator(viewer, null);
  await Promise.all(
    previews.filter(isDefined).map(async (link) => {
      await messageLinkPreviewMutator.upsert({
        messageID,
        url: link.url,
        img: link.img ?? null,
        description: link.description ?? null,
        title: link.title ?? null,
      });
    }),
  );
}

async function removeLinks(
  existingPreviews: MessageLinkPreviewEntity[],
  links: string[],
) {
  const linksToRemove = existingPreviews.filter((preview) => {
    return !links.find((link) => preview.url === link);
  });

  await Promise.all(
    linksToRemove.map(async (preview) => {
      await preview.destroy();
    }),
  );
}
