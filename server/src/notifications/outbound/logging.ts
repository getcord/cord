import { nanoid } from 'nanoid';
import { CORD_TO_ORIGIN } from 'common/const/Urls.ts';
import { DEFAULT_NOTIFICATION_LOGGING_PATH } from 'server/src/public/routes/MainRouter.ts';
import type {
  OutboundNotificationMetadataByType,
  OutboundNotificationType,
  UUID,
} from 'common/types/index.ts';
import { MessageOutboundNotificationEntity } from 'server/src/entity/message_notification/MessageOutboundNotificationEntity.ts';
import { NOTIFICATION_LOGGING_REDIRECT_ID_LENGTH } from 'common/const/Api.ts';

type NotificationLoggingData<Type extends OutboundNotificationType> = {
  messageID: UUID;
  url: string;
  targetOrgID: UUID;
  targetUserID: UUID | null;
  type: Type;
  platformApplicationID: UUID | undefined;
  metadata: OutboundNotificationMetadataByType[Type];
  sharerUserID: UUID;
  sharerOrgID: UUID;
};

export async function generateOutboundNotificationLoggingURL<
  Type extends OutboundNotificationType,
>({
  messageID,
  url,
  targetOrgID,
  targetUserID,
  type,
  metadata,
  sharerUserID,
  sharerOrgID,
}: NotificationLoggingData<Type>): Promise<string> {
  const entity = await MessageOutboundNotificationEntity.create({
    id: nanoid(NOTIFICATION_LOGGING_REDIRECT_ID_LENGTH),
    messageID,
    url,
    type,
    targetUserID,
    targetOrgID,
    metadata,
    sharerUserID,
    sharerOrgID,
  });

  if (!entity) {
    throw new Error(
      `Unable to create entity for message notification ${messageID}, type ${type}, url ${url}`,
    );
  }

  return `${CORD_TO_ORIGIN}${DEFAULT_NOTIFICATION_LOGGING_PATH}/${entity.id}`;
}
