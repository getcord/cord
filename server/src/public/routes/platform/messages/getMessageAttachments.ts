import * as base64 from 'js-base64';
import { externalizeID } from 'common/util/externalIDs.ts';
import type {
  MessageAnnotationAttachment,
  MessageAttachment,
  MessageFileAttachment,
  MessageLinkPreviewAttachment,
  MessageScreenshotAttachment,
} from '@cord-sdk/types';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
  MessageScreenshotAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { isDefined } from 'common/util/index.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import type { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import { MessageAttachmentType } from 'common/types/index.ts';

export async function getMessageAttachments(
  loaders: RequestContextLoaders,
  message: MessageEntity,
): Promise<MessageAttachment[]> {
  const attachments =
    await loaders.messageAttachmentLoader.loadAttachmentsForMessage(message.id);

  const fileIDs = attachments
    .map((a) => {
      if (a instanceof MessageAttachmentEntity) {
        if ('fileID' in a.data) {
          return a.data.fileID;
        } else if ('screenshotFileID' in a.data) {
          return a.data.screenshotFileID;
        }
      }
      return undefined;
    })
    .filter(isDefined);

  const files = await loaders.fileLoader.loadFiles(fileIDs);
  const filesByID = new Map<string, FileEntity>();

  for (const file of files) {
    filesByID.set(file.id, file);
  }

  return (
    await Promise.all(
      attachments.map(async (a) => {
        if (a instanceof MessageAttachmentEntity) {
          switch (a.type) {
            case MessageAttachmentType.FILE:
              return await makeFile(
                filesByID.get((a.data as MessageFileAttachmentData).fileID),
              );
            case MessageAttachmentType.ANNOTATION: {
              const data = a.data as MessageAnnotationAttachmentData;
              if (!data.screenshotFileID) {
                return undefined;
              }
              return await makeAnnotation(
                filesByID.get(data.screenshotFileID),
                data,
              );
            }
            case MessageAttachmentType.SCREENSHOT: {
              const data = a.data as MessageScreenshotAttachmentData;
              if (!data.screenshotFileID) {
                return undefined;
              }
              return await makeScreenshot(filesByID.get(data.screenshotFileID));
            }
          }
        } else {
          return makeLinkPreview(a);
        }
      }),
    )
  ).filter(isDefined);
}

async function makeFile(
  f: FileEntity | undefined,
): Promise<MessageFileAttachment | undefined> {
  if (!f) {
    return undefined;
  }
  return {
    id: externalizeID(f.id),
    type: 'file',
    name: f.name,
    url: await f.getSignedDownloadURL(),
    mimeType: f.mimeType,
    size: f.size,
    uploadStatus: f.uploadStatus,
  };
}

async function makeScreenshot(
  screenshot: FileEntity | undefined,
): Promise<MessageScreenshotAttachment | undefined> {
  if (!screenshot) {
    return undefined;
  }
  return {
    type: 'screenshot',
    screenshot: {
      id: externalizeID(screenshot.id),
      name: 'annotation',
      url: await screenshot.getSignedDownloadURL(),
      mimeType: screenshot.mimeType,
      size: screenshot.size,
      uploadStatus: screenshot.uploadStatus,
    },
  };
}

async function makeAnnotation(
  screenshot: FileEntity | undefined,
  a: MessageAnnotationAttachmentData,
): Promise<MessageAnnotationAttachment | undefined> {
  if (!screenshot) {
    return undefined;
  }
  return {
    type: 'annotation',
    screenshot: {
      id: externalizeID(screenshot.id),
      name: 'annotation',
      url: await screenshot.getSignedDownloadURL(),
      mimeType: screenshot.mimeType,
      size: screenshot.size,
      uploadStatus: screenshot.uploadStatus,
    },
    locationData: a.location ? base64.encode(JSON.stringify(a.location)) : null,
    customData: a.customLocation
      ? {
          location: a.customLocation,
          coordsRelativeToTarget: a.coordsRelativeToTarget!, // always set when custom locations used
          label: a.customLabel ?? null,
        }
      : null,
    textContent:
      a.location?.highlightedTextConfig?.textToDisplay ??
      a.customHighlightedTextConfig?.textToDisplay ??
      null,
  };
}

function makeLinkPreview(
  a: MessageLinkPreviewEntity,
): MessageLinkPreviewAttachment {
  return {
    id: a.id,
    type: 'link_preview',
    url: a.url,
    imageURL: a.img,
    title: a.title,
    description: a.description,
  };
}
