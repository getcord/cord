import type { CreationAttributes, Transaction } from 'sequelize';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasPlatformUser,
  viewerHasIdentity,
} from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { Counter, incCounterWithAppID } from 'server/src/logging/prometheus.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { publishEventToWebhook } from 'server/src/webhook/webhook.ts';
import { whereAggregatedNotificationEntity } from 'server/src/public/mutations/notifications/utils.ts';
import { Logger } from 'server/src/logging/Logger.ts';

const counter = Counter({
  name: 'NotificationEntityCreated',
  help: 'Count of created/sent notifications (raw DB rows)',
  labelNames: ['appID', 'type'],
});

export const markedCounter = Counter({
  name: 'NotificationEntityMarkedAsRead',
  help: 'Count of NotificationEntity marked as read',
  labelNames: ['appID'],
});

export const unmarkedCounter = Counter({
  name: 'NotificationEntityMarkedAsUnread',
  help: 'Count of NotificationEntity marked as unread',
  labelNames: ['appID'],
});

export class NotificationMutator {
  viewer: Viewer;
  logger: Logger;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.logger = new Logger(viewer);
  }

  async create(
    attrs: Omit<
      CreationAttributes<NotificationEntity>,
      'senderID' | 'platformApplicationID'
    >,
    transaction?: Transaction,
  ): Promise<NotificationEntity> {
    const { userID, platformApplicationID } = assertViewerHasPlatformUser(
      this.viewer,
    );
    const notif = await NotificationEntity.create(
      {
        ...attrs,
        senderID: userID,
        platformApplicationID,
      },
      { transaction },
    );

    if (transaction) {
      transaction.afterCommit(async () => {
        await this.postCreate(notif);
      });
    } else {
      await this.postCreate(notif);
    }

    return notif;
  }

  async createExternal(
    attrs: Omit<CreationAttributes<NotificationEntity>, 'type'>,
    transaction?: Transaction,
  ): Promise<NotificationEntity> {
    if (viewerHasIdentity(this.viewer)) {
      throw new Error(
        'Expected viewer to not have identity -- did you mean to use create instead of createExternal?',
      );
    }

    const notif = await NotificationEntity.create(
      {
        ...attrs,
        type: 'external',
      },
      { transaction },
    );

    if (transaction) {
      transaction.afterCommit(async () => {
        await this.postCreate(notif);
      });
    } else {
      await this.postCreate(notif);
    }

    return notif;
  }

  private async postCreate(notif: NotificationEntity) {
    counter.inc({ type: notif.type, appID: notif.platformApplicationID }, 1);

    const app = await ApplicationEntity.findByPk(notif.platformApplicationID);
    if (!app) {
      throw new Error(`Cannot find app ${notif.platformApplicationID}`);
    }

    backgroundPromise(
      Promise.all([
        publishPubSubEvent(
          'notification-added',
          { userID: notif.recipientID },
          { notificationID: notif.id },
        ),
        publishEventToWebhook(app, {
          type: 'notification-created',
          notificationID: notif.id,
          userID: notif.recipientID,
        }),
      ]),
    );
  }

  async markAsRead(notif: NotificationEntity) {
    const [affectedCount] = await NotificationEntity.update(
      { readStatus: 'read' },
      { where: whereAggregatedNotificationEntity(notif) },
    );

    backgroundPromise(
      publishPubSubEvent(
        'notification-read-state-updated',
        { userID: notif.recipientID },
        { notificationID: notif.id },
      ),
      this.logger,
    );

    incCounterWithAppID(this.viewer, markedCounter, {}, affectedCount);

    return affectedCount;
  }

  async markAsUnread(notif: NotificationEntity) {
    const [affectedCount] = await NotificationEntity.update(
      { readStatus: 'unread' },
      { where: whereAggregatedNotificationEntity(notif) },
    );

    backgroundPromise(
      publishPubSubEvent(
        'notification-read-state-updated',
        { userID: notif.recipientID },
        { notificationID: notif.id },
      ),
      this.logger,
    );

    incCounterWithAppID(this.viewer, unmarkedCounter, {}, affectedCount);

    return affectedCount;
  }
}
