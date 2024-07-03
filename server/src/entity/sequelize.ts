import type { SequelizeOptions } from 'sequelize-typescript';
import { Sequelize } from 'sequelize-typescript';

import { DatabaseError, QueryTypes, Transaction } from 'sequelize';
import env from 'server/src/config/Env.ts';
import sleep from 'common/util/sleep.ts';
import { EventEntity } from 'server/src/entity/event/EventEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageReactionEntity } from 'server/src/entity/message_reaction/MessageReactionEntity.ts';
import { MessageMentionEntity } from 'server/src/entity/message_mention/MessageMentionEntity.ts';
import { SlackChannelEntity } from 'server/src/entity/slack_channel/SlackChannelEntity.ts';
import { SlackMessageEntity } from 'server/src/entity/slack_message/SlackMessageEntity.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import {
  Gauge,
  TimeHistogram,
  logBuckets,
} from 'server/src/logging/prometheus.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { PageVisitorEntity } from 'server/src/entity/page_visitor/PageVisitorEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { S3BucketEntity } from 'server/src/entity/s3_bucket/S3BucketEntity.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { asyncLocalStorage } from 'server/src/logging/performance.ts';
import { HeimdallEntity } from 'server/src/entity/heimdall/HeimdallEntity.ts';
import { EmailSubscriptionEntity } from 'server/src/entity/email_subscription/EmailSubscriptionEntity.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import { SlackMirroredThreadEntity } from 'server/src/entity/slack_mirrored_thread/SlackMirroredThreadEntity.ts';
import { MessageOutboundNotificationEntity } from 'server/src/entity/message_notification/MessageOutboundNotificationEntity.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
import { UserHiddenAnnotationsEntity } from 'server/src/entity/user_hidden_annotations/UserHiddenAnnotationsEntity.ts';
import { ExternalAssetEntity } from 'server/src/entity/extrernal_asset/ExternalAssetEntity.ts';
import { ImageVariantEntity } from 'server/src/entity/image_variant/ImageVariantEntity.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import { SlackMirroredSupportThreadEntity } from 'server/src/entity/slack_mirrored_support_thread/SlackMirroredSupportThreadEntity.ts';
import { DeploysEntity } from 'server/src/entity/deploys/DeploysEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { TaskThirdPartySubscriptionEntity } from 'server/src/entity/task_third_party_subscription/TaskThirdPartySubscriptionEntity.ts';
import { ApplicationUsageMetricEntity } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricEntity.ts';
import { ApplicationUsageMetricTypeEntity } from 'server/src/entity/application_usage_metric/ApplicationUsageMetricTypeEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { AdminGoRedirectEntity } from 'server/src/entity/go_redirect/AdminGoRedirectEntity.ts';
import type { WorkerType } from 'server/src/server.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';
import { AdminCRTCustomerIssueChangeEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { AdminCRTCustomerIssueSubscriptionEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueSubscriptionEntity.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import { ApplicationWebhookEntity } from 'server/src/entity/application_webhook/ApplicationWebhookEntity.ts';
import { WarmDemoUserEntity } from 'server/src/entity/demo/WarmDemoUserEntity.ts';
import { PreallocatedThreadIDEntity } from 'server/src/entity/preallocated_thread_id/PreallocatedThreadIDEntity.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import { OrgOrgMembersEntity } from 'server/src/entity/org_org_members/OrgOrgMembersEntity.ts';

const {
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} = env;

const MAX_QUERY_LOG_LENGTH = 10000;

type SequelizeWorkerType = WorkerType | 'async' | 'test' | 'master' | 'script';

const queryExecutionTimeMetric = TimeHistogram({
  name: 'SequelizeQueryTime',
  help: 'Execution time of Sequelize queries',
  labelNames: ['type', 'appID'],
});

const openDbConnectionsMetric = Gauge({
  name: 'OpenDatabaseConnections',
  help: 'Number of open database connections',
});

const acquireTimeMetric = TimeHistogram({
  name: 'SequelizePoolAcquireTime',
  help: 'Time spent waiting to acquire a Sequelize connection',
  // Like our default buckets, but extend the lower bound down to 10us because
  // connection acquire should be very fast.
  buckets: logBuckets(0.00001, 10, 19),
});

// These metrics use `sequelize.connectionManager as any` because the
// connectionManager has a public property that holds the actual pool (a Pool
// object from sequelize-pool), but it doesn't appear in the TS types.

const _availableConnectionsMetric = Gauge({
  name: 'SequelizePoolAvailable',
  help: 'Number of available connections in the Sequelize connection pool',
  collect() {
    if (sequelize) {
      this.set((sequelize.connectionManager as any).pool.available);
    }
  },
});

const _usingConnectionsMetric = Gauge({
  name: 'SequelizePoolUsed',
  help: 'Number of in-use connections in the Sequelize connection pool',
  collect() {
    if (sequelize) {
      this.set((sequelize.connectionManager as any).pool.using);
    }
  },
});

const _waitingConnectionsMetric = Gauge({
  name: 'SequelizePoolWaiting',
  help: 'Number of requests waiting for a Sequelize connection',
  collect() {
    if (sequelize) {
      this.set((sequelize.connectionManager as any).pool.waiting);
    }
  },
});

const acquireStarts = new WeakMap<object, number>();

const apiSequelizeOptions: SequelizeOptions = {
  dialect: 'postgres',
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  schema: 'cord',
  models: [
    EventEntity,
    MessageEntity,
    MessageAttachmentEntity,
    MessageLinkPreviewEntity,
    ThreadParticipantEntity,
    PageVisitorEntity,
    OrgEntity,
    UserEntity,
    FileEntity,
    PageEntity,
    ThreadEntity,
    PreallocatedThreadIDEntity,
    MessageReactionEntity,
    MessageMentionEntity,
    SlackChannelEntity,
    SlackMessageEntity,
    UserPreferenceEntity,
    DeploysEntity,
    TaskEntity,
    TaskTodoEntity,
    TaskAssigneeEntity,
    ThirdPartyConnectionEntity,
    TaskThirdPartyReference,
    TaskThirdPartySubscriptionEntity,
    ApplicationEntity,
    CustomerEntity,
    SessionEntity,
    OrgMembersEntity,
    S3BucketEntity,
    HeimdallEntity,
    EmailSubscriptionEntity,
    LinkedOrgsEntity,
    LinkedUsersEntity,
    SlackMirroredThreadEntity,
    MessageOutboundNotificationEntity,
    ConsoleUserEntity,
    UserHiddenAnnotationsEntity,
    ExternalAssetEntity,
    ImageVariantEntity,
    EmailOutboundNotificationEntity,
    SlackMirroredSupportThreadEntity,
    ApplicationUsageMetricEntity,
    ApplicationUsageMetricTypeEntity,
    NotificationEntity,
    AdminGoRedirectEntity,
    AdminCRTCustomerIssueEntity,
    AdminCRTCustomerIssueChangeEntity,
    AdminCRTCustomerIssueSubscriptionEntity,
    ApplicationWebhookEntity,
    WarmDemoUserEntity,
    PermissionRuleEntity,
    OrgOrgMembersEntity,
  ],
  benchmark: true,
  logging: (...args) => {
    // In `sequelize-typescript`, the arguments to `logging` are declared as
    // `(msg: string, timing: number)` only, but Sequelize does give us an
    // additional object full of information. Override the typing:
    const [msg, timing_ms, sequelizeInfo] = args as unknown as [
      string,
      number,
      any,
    ];

    // CloudWatch doesn't allow messages over a certain length, and well before
    // that we hit the point where a human reading it will get the idea
    // (inevitably, a gigantic WHERE clause). Serializing all that crap also
    // takes CPU time. So cut down truly absurd messages to something a little
    // less absurd.
    const truncatedMsg =
      msg.length <= MAX_QUERY_LOG_LENGTH
        ? msg
        : msg.substring(0, MAX_QUERY_LOG_LENGTH) +
          ` (truncated from ${msg.length} bytes)`;

    // The `sequelizeInfo` object may contain a huge amount of information,
    // including full model definition and information on each and every type
    // that exists in SQL, etc. etc.
    // We pick a few fields to log:
    // * type: the operation type such as 'SELECT', 'INSERT', etc. This is the
    // Sequelize operation type, which is not the same as SQL, because it
    // includes e.g. 'UPSERT'
    // * bind: the parameter values bound to query placeholders (`$1`, `$2`,
    // ...)
    // * tableNames: just a list of the names of tables involved in this
    // operation
    const { type, bind, tableNames } = sequelizeInfo;

    const storage = asyncLocalStorage?.getStore();

    const logger = storage?.logger ?? anonymousLogger();
    logger.debug(`Sequelize: ${truncatedMsg}`, {
      sequelize: { type, bind, tableNames },
      timing_ms,
      operationName: storage?.operationName,
      operationID: storage?.operationID,
      platformApplicationID: storage?.platformApplicationID,
    });

    // time histogram work in units of seconds, we get milliseconds from
    // Sequelize
    queryExecutionTimeMetric.observe(
      { type, appID: storage?.platformApplicationID },
      timing_ms / 1000,
    );
  },
  pool: {
    // Maximum number of connection in pool
    max: 50,

    // Minimum number of connection in pool
    min: 50,

    // The number of times a connection can be used before discarding it for a
    // replacement
    maxUses: 500,

    // Time out if the pool doesn't manage to establish a new connection within
    // 10 seconds
    acquire: 10000,
  },
  hooks: {
    // on any new database connection we set the search path, so when
    // database objects (tables, types, functions etc.) are given without
    // explicitly specifying the schema they are in, they are found if
    // they are in either cord or public.
    // This is also done in `.sequelize-config.js` so that it applies in
    // migrations, where statements such as `CREATE TABLE` will create
    // objects in the first schema of the search_path (`cord`).
    afterConnect: async (connection: any) => {
      await connection.query('SET search_path=cord,public;');
      openDbConnectionsMetric.inc(1);
    },
    afterDisconnect: (_connection: any) => {
      openDbConnectionsMetric.dec(1);
    },
    beforePoolAcquire: (options) => {
      acquireStarts.set(options, performance.now());
    },
    afterPoolAcquire: (_connection, options) => {
      const start = acquireStarts.get(options);
      if (start) {
        const elapsed = performance.now() - start;
        acquireStarts.delete(options);
        acquireTimeMetric.observe(elapsed / 1000);
      }
    },
  },
  dialectOptions: {
    // any SQL statement should timeout after 10s (10s is very conservative, we
    // might want to reduce it further eventually).
    statement_timeout: 10000,
    // a transaction that does not send a statement for 5s should timeout
    idle_in_transaction_session_timeout: 5000,
  },
};

function initializeEntityRelationships() {
  MessageEntity.hasMany(MessageMentionEntity, {
    as: 'mentions',
    foreignKey: 'messageID',
  });

  MessageEntity.hasMany(TaskEntity, {
    as: 'tasks',
    foreignKey: 'messageID',
  });

  TaskEntity.hasMany(TaskAssigneeEntity, {
    as: 'assignees',
    foreignKey: 'taskID',
  });

  TaskEntity.hasOne(MessageEntity, {
    sourceKey: 'messageID',
    foreignKey: 'id',
    as: 'message',
  });

  TaskThirdPartyReference.hasOne(TaskEntity, {
    as: 'task',
    sourceKey: 'taskID',
    foreignKey: 'id',
  });

  OrgEntity.hasOne(LinkedOrgsEntity, {
    sourceKey: 'id',
    foreignKey: 'linkedOrgID',
  });

  OrgMembersEntity.hasOne(UserEntity, {
    sourceKey: 'userID',
    foreignKey: 'id',
  });

  MessageEntity.hasOne(ThreadEntity, {
    as: 'thread',
    sourceKey: 'threadID',
    foreignKey: 'id',
  });
}

let sequelize: Sequelize | undefined;

export function getSequelize(): Sequelize {
  if (sequelize === undefined) {
    throw new Error('Sequelize has not been initialised');
  }
  return sequelize;
}

function getSequelizeOptions(
  workerType: SequelizeWorkerType,
): SequelizeOptions {
  switch (workerType) {
    case 'api':
    case 'test':
    case 'master':
    case 'script':
      return apiSequelizeOptions;
    case 'async':
      return {
        ...apiSequelizeOptions,
        dialectOptions: {
          // Set the statement timeout to 2 minutes (in milliseconds), to allow
          // longer-running SQL statements in async jobs
          ...apiSequelizeOptions.dialectOptions,
          statement_timeout: 2 * 60 * 1000,
        },
      };
    case 'admin':
    case 'console':
      return {
        ...apiSequelizeOptions,
        pool: {
          ...apiSequelizeOptions.pool,
          max: 20,
          min: 0,
        },
      };
    default: {
      const _exhaustiveSwitchGuard: never = workerType;
      throw new Error('Invalid worker type ' + workerType);
    }
  }
}

export async function initSequelize(workerType: SequelizeWorkerType) {
  if (sequelize !== undefined) {
    throw new Error('Sequelize has been already initialised');
  }
  const opts = getSequelizeOptions(workerType);
  const seq = new Sequelize(opts);
  initializeEntityRelationships();

  await seq.authenticate();
  sequelize = seq;
}

export function shutdownSequelize() {
  const s = sequelize;
  sequelize = undefined;
  return s ? s.close() : Promise.resolve();
}

const MAX_RETRIES = 5;

export async function serializableTransactionWithRetries<T>(
  body: (t: Transaction) => Promise<T>,
) {
  let lastException;
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      return await getSequelize().transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        body,
      );
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        'code' in e.original &&
        (e.original.code === '40001' || e.original.code === '40P01')
      ) {
        // Per https://www.postgresql.org/docs/current/errcodes-appendix.html,
        // 40001 is serialization_error and 40P01 is deadlock_detected, which
        // are the two cases we expect to have some chance of success if we
        // retry
        lastException = e;
        // Exponential backoff to try to let other txns complete first. Wait
        // 50ms, then 100ms, then 200ms, etc.
        const exp = 2 ** retryCount;
        const baseMs = 50 * exp;
        const randMs = 50 * exp * Math.random();
        await sleep(baseMs + randMs);
        continue;
      }
      throw e;
    }
  }
  throw lastException;
}

export async function assertTransactionIsSerializable(
  transaction: Transaction,
) {
  const type = await getSequelize().query<{ isolation_level: string }>(
    `SELECT current_setting('transaction_isolation') AS isolation_level`,
    {
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  // we have to lowercase the sequelize type as the value coming
  // back from postgres is lowercase
  const isSerializable =
    type[0].isolation_level ===
    Transaction.ISOLATION_LEVELS.SERIALIZABLE.toLowerCase();

  if (!isSerializable) {
    throw new Error('Transaction must be serializable');
  }
}
