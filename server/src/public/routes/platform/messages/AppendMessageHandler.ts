import type { Request, Response } from 'express';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { executeAppendMessageContentTasks } from 'server/src/message/executeMessageTasks.ts';
import { appendMessageContent } from 'common/util/appendMessageContent.ts';

async function AppendMessageHandler(req: Request, res: Response) {
  const vars = validate.AppendMessageVariables(req.body);

  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const [context, updatedMessage] = await getSequelize().transaction(
    // Note that we don't bother to do most of the operations below through the
    // transaction, just the read+write of the message, so that we append the
    // content atomically. This endpoint is designed to be slammed by AI bots
    // streaming data, so having it be lightweight is important, but also
    // read-update races are likely to be more common than usual so we need to
    // deal with them.
    async (transaction) => {
      const [thread, message] = await Promise.all([
        ThreadEntity.findOne({
          where: {
            externalID: req.params.threadID,
            platformApplicationID,
          },
        }),
        MessageEntity.findOne({
          where: {
            externalID: req.params.messageID,
            platformApplicationID,
          },
          transaction,
        }),
      ]);

      if (!thread) {
        throw new ApiCallerError('thread_not_found');
      }

      if (!message || message.threadID !== thread.id) {
        throw new ApiCallerError('message_not_found');
      }

      const [sender, org] = await Promise.all([
        UserEntity.findByPk(message.sourceID),
        OrgEntity.findByPk(message.orgID),
      ]);

      if (!org) {
        throw new ApiCallerError('organization_not_found');
      }

      if (!sender) {
        throw new ApiCallerError('user_not_found', {
          message: `Message author not found`,
        });
      }

      const viewer = await Viewer.createLoggedInPlatformViewer({
        user: sender,
        org,
      });

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const context = await contextWithSession(
        { viewer },
        getSequelize(),
        null,
        null,
      );

      const newContent = appendMessageContent(message.content, vars.text);
      if (!newContent) {
        throw new ApiCallerError('message_not_appendable');
      }

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const updatedMessage = await message.update(
        { content: newContent },
        { transaction },
      );

      return [context, updatedMessage];
    },
  );

  await executeAppendMessageContentTasks({
    context,
    message: updatedMessage,
    appendedContent: vars.text,
  });

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated message ${req.params.messageID}`,
  });
}

export default forwardHandlerExceptionsToNext(AppendMessageHandler);
