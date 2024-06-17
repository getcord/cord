import addrs from 'email-addresses';
import { FeatureFlag } from 'common/const/UserPreferenceKeys.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';
import { isDefined } from 'common/util/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { injectDeeplinkQueryParamsV1 } from 'server/src/deep_link_threads/index.ts';
import { sendShareThreadToEmailEmail } from 'server/src/email/index.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
  MessageScreenshotAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { getFileAttachmentEntities } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getFeatureFlagValue,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { generateOutboundNotificationLoggingURL } from 'server/src/notifications/outbound/logging.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getThreadDetails } from 'server/src/util/email.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { getTemplateIDForNotification } from 'server/src/email/util.ts';

export const shareThreadToEmailResolver: Resolvers['Mutation']['shareThreadToEmail'] =
  sendErrors(async (_, args, originalContext) => {
    const { threadID, email, screenshotID, byExternalID } = args;

    // Just making sure the email address is a valid one
    const parsedEmailAddress = addrs.parseOneAddress(email);
    const validDomain =
      parsedEmailAddress?.type === 'mailbox' &&
      parsedEmailAddress.domain.includes('.');

    if (!parsedEmailAddress || !validDomain) {
      throw new ApiCallerError('invalid_email');
    }

    const thread = byExternalID
      ? await originalContext.loaders.threadLoader.loadByExternalID(threadID)
      : await originalContext.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      throw new ApiCallerError('thread_not_found');
    }

    const context = await getRelevantContext(originalContext, thread.orgID);
    const { viewer } = context.session;
    const { userID, orgID } = assertViewerHasIdentity(viewer);
    const customerID = context.application?.customerID;

    const [forceShareViaEmailEnabled, shareViaEmailEnabled] = await Promise.all(
      [
        context.loaders.userPreferenceLoader.loadPreferenceValueForViewer(
          FeatureFlag.EMAIL_SHARING,
        ),
        getTypedFeatureFlagValue(FeatureFlags.EMAIL_SHARING, {
          userID,
          orgID,
          platformApplicationID: viewer.platformApplicationID ?? 'extension',
          version: context.clientVersion,
          customerID,
        }),
      ],
    );
    if (shareViaEmailEnabled !== true && forceShareViaEmailEnabled !== true) {
      throw new ApiCallerError('invalid_request', {
        message: 'Unable to share via email',
      });
    }

    const [sender, [lastMessage]] = await Promise.all([
      context.loaders.userLoader.loadUserInAnyViewerOrg(userID),
      context.loaders.messageLoader.loadMessages({
        threadID: thread.id,
        ignoreDeleted: true,
        range: -1,
      }),
    ]);

    if (!sender || !thread || !lastMessage) {
      context.logger.error(
        'Failed to share email because a required entity failed to load',
        {
          userID,
          fetched_user_id: sender?.id,
          threadID: thread.id,
          fetched_thread_id: thread?.id,
          fetched_last_message: lastMessage.id,
          email,
        },
      );
      throw new ApiCallerError('invalid_request', {
        message: 'Unable to share via email',
      });
    }

    let partnerDetails: CustomEmailTemplate | undefined = undefined;
    if (sender.platformApplicationID) {
      const application = await context.loaders.applicationLoader.load(
        sender.platformApplicationID,
      );

      partnerDetails = application?.customEmailTemplate ?? undefined;
    }
    const featureFlagUser = flagsUserFromContext(context);
    // NOTE: Instead of creating a new FeatureFlag, I am re-using
    // QUERY_PARAM_DEEP_LINKS_IN_SHARE_TO_SLACK because if a vendor allowed us to
    // inject deeplinking query parameters into their URLs when we share a thread
    // to Slack, we can probably inject the query parameters into their URLs
    // here too.
    const injectDeeplinkQueryParams = await getFeatureFlagValue(
      FeatureFlag.QUERY_PARAM_DEEP_LINKS_IN_SHARE_TO_SLACK,
      featureFlagUser,
    );

    let notificationURL = lastMessage.url || thread.url;
    if (injectDeeplinkQueryParams === true) {
      notificationURL = injectDeeplinkQueryParamsV1(
        context.logger,
        notificationURL,
        thread.id,
        lastMessage.id,
      );
    }

    // Check if the email is registered to an individual in the Application space
    // We only consider the user to be found if there is one and only one user with
    // that email and that organization.  Otherwise, we don't know which user to
    // associate a reply with so we don't specify a particular user
    let targetUserID: string | null = null;
    const potentialEmailUsers =
      await context.loaders.userLoader.loadUserForEmailInOrg(email, orgID);
    if (potentialEmailUsers.length === 1) {
      targetUserID = potentialEmailUsers[0].id;
    }

    // wrap in cord.to redirect
    notificationURL = await generateOutboundNotificationLoggingURL({
      messageID: lastMessage.id,
      url: notificationURL,
      targetOrgID: orgID,
      targetUserID,
      type: 'sharedToEmail',
      platformApplicationID: viewer.platformApplicationID,
      metadata: {
        type: 'sharedToEmail',
        targetEmail: email,
      },
      sharerUserID: userID,
      sharerOrgID: orgID,
    });

    const messageAttachments =
      await context.loaders.messageAttachmentLoader.loadAttachmentsForMessage(
        lastMessage.id,
      );
    const files = await context.loaders.fileLoader.loadFiles(
      getFileAttachmentEntities(messageAttachments)
        .map((attachment) => {
          switch (attachment.type) {
            case MessageAttachmentType.FILE:
              return (attachment.data as MessageFileAttachmentData).fileID;
            case MessageAttachmentType.ANNOTATION: {
              const data = attachment.data as MessageAnnotationAttachmentData;
              return data.blurredScreenshotFileID ?? data.screenshotFileID;
            }
            case MessageAttachmentType.SCREENSHOT: {
              const data = attachment.data as MessageScreenshotAttachmentData;
              return data.blurredScreenshotFileID ?? data.screenshotFileID;
            }

            default:
              return null;
          }
        })
        .filter(isDefined),
    );

    const imageURLs = files
      .filter((file) => isInlineDisplayableImage(file.mimeType))
      .map((file) => file.getPermanentDownloadURL());
    const nonImageAttachmentNames = files
      .filter((file) => !isInlineDisplayableImage(file.mimeType))
      .map((file) => file.name);

    if (screenshotID && imageURLs.length === 0) {
      // only include screenshot as extra context if there aren't other images
      // for context
      const screenshotFile =
        await context.loaders.fileLoader.loadFile(screenshotID);
      if (screenshotFile) {
        imageURLs.push(screenshotFile.getPermanentDownloadURL());
      } else {
        context.logger.error(
          'Failed to share email because a screenshotFile failed to load',
          {
            screenshotID,
            userID,
            threadID: thread.id,
            last_message: lastMessage.id,
            email,
          },
        );
      }
    }

    const getThreadDetailsArgs = {
      threadID: thread.id,
      currentMessage: lastMessage,
      userID,
      sender,
      currentMessageAttachments: imageURLs,
      currentFileAttachments: nonImageAttachmentNames,
      context,
    };
    const threadDetails = await getThreadDetails(getThreadDetailsArgs);

    if (!threadDetails) {
      context.logger.error(
        'Failed to share email because building threadDetails failed',
        {
          threadID,
          currentMessage: lastMessage.id,
          userID,
          sender: sender.id,
          currentMessageAttachments: imageURLs,
          currentFileAttachments: nonImageAttachmentNames,
          email,
        },
      );
      throw new ApiCallerError('thread_not_found');
    }

    let emailNotification = null;
    if (targetUserID) {
      emailNotification = await EmailOutboundNotificationEntity.create({
        userID: targetUserID,
        orgID: orgID,
        threadID: thread.id,
        email: email,
        // Target user may not be in same org - could instead be part of Slack org
        threadOrgID: thread.orgID,
      });
    }
    const templateID = await getTemplateIDForNotification({
      notificationActionType: 'share_to_email',
      context,
      featureFlagUser,
    });

    // TODO: should there be an unsubscribe URL?
    const success = await sendShareThreadToEmailEmail(
      context,
      email,
      thread.name,
      notificationURL,
      partnerDetails,
      threadDetails,
      emailNotification,
      templateID,
    );

    return { success, failureDetails: null };
  });
