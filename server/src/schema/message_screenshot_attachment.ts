import type { RequestContext } from 'server/src/RequestContext.ts';
import type { MessageScreenshotAttachmentData } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageScreenshotAttachmentResolver: Resolvers['MessageScreenshotAttachment'] =
  {
    screenshot: async (messageAttachment, _, context) =>
      await loadScreenshotById(
        context,
        (messageAttachment.data as MessageScreenshotAttachmentData)
          .screenshotFileID,
      ),
    blurredScreenshot: async (messageAttachment, _, context) =>
      await loadScreenshotById(
        context,
        (messageAttachment.data as MessageScreenshotAttachmentData)
          .blurredScreenshotFileID,
      ),
  };

async function loadScreenshotById(
  context: RequestContext,
  screenshotId: string | null | undefined,
) {
  if (!screenshotId) {
    return null;
  }

  try {
    return await context.loaders.fileLoader.loadFile(screenshotId);
  } catch (e) {
    return null;
  }
}
