import { Analytics } from '@segment/analytics-node';
import type { Session } from 'server/src/auth/index.ts';
import type { DeploymentType, JsonObject, UUID } from 'common/types/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export class SegmentLogger {
  private partnerAnalytics: Analytics | null;
  constructor(
    public session: Session,
    public clientVersion: string | null,
    public connectionID: UUID,
    public deployment: DeploymentType | null,
    // TODO(flooey): We don't need a boolean value for this
    public switchedOn: boolean,
    application: ApplicationEntity | null,
  ) {
    if (application?.segmentWriteKey) {
      this.partnerAnalytics = new Analytics({
        writeKey: application.segmentWriteKey,
      });
    } else {
      this.partnerAnalytics = null;
    }
  }

  partnerLog(
    eventName: string,
    metadata: JsonObject,
    payload: JsonObject,
    customEventMetadata: JsonObject | undefined,
  ): void {
    if (
      this.switchedOn &&
      this.partnerAnalytics !== null &&
      this.session.viewer.externalUserID &&
      INCLUDED_EVENTS.has(eventName)
    ) {
      this.partnerAnalytics.track({
        userId: this.session.viewer.externalUserID,
        event: 'cord-' + eventName,
        properties: {
          organization_id: this.session.viewer.externalOrgID,
          group_id: this.session.viewer.externalOrgID,
          location: metadata.url,
          method: payload.method,
          type: payload.type,
          task_provider: payload.provider,
          mentions: payload.mentions,
          attachments: payload.attachments,
          annotations: payload.annotations,
          new_thread: payload.newThread,
          cord_location: payload.location,
          to: payload.to,
          thread_id: payload.threadID,
          message_id: payload.messageID,
          service: payload.service,
          reason: payload.reason,
          email: payload.email,
          success: payload.success,
          custom_event_metadata: customEventMetadata,
        },
        timestamp: new Date(),
      });
    }
  }

  publishMessageSendEvent(
    thread: ThreadEntity,
    message: MessageEntity,
    newThread: boolean,
    mentionsCount: number,
  ) {
    const metadata = {
      url: thread.url,
    };
    const payload = {
      mentions: mentionsCount,
      threadID: thread.externalID,
      newThread: newThread,
      messageID: message.externalID,
    };
    // Currently not supported for this event because it is not easily available on the server
    const customEventMetadata = {};
    this.partnerLog('message-send', metadata, payload, customEventMetadata);
  }
}

const INCLUDED_EVENTS = new Set([
  'click-share-thread-to-email-submit-button',
  'click-thread-menu-share-to-email',
  'click-upgrade-plan',
  'connect-service-failed',
  'connect-service-started',
  'connect-service-successful',
  'create-new-profile',
  'create-task',
  'disconnect-service',
  'hover-for-presence',
  'insert-assignee',
  'insert-mention',
  'logout',
  'message-delete-undone',
  'message-deleted',
  'message-send',
  /* Added to support a customer who uses the customEventMetadata field
  that message-send used to send before we moved it server side 
  */
  'message-send-ui',
  'message-updated',
  'navigate-to',
  'remove-task',
  'render-embedded-launcher',
  'render-sidebar-open',
  'select-profile',
  'slack-login-launched',
  'subscribed-to-thread',
  'thread-resolved',
  'thread-shared-to-email',
  'thread-unresolved',
  'toggle-sidebar-visibility',
  'unsubscribed-from-thread',
  'update-profile',
]);
