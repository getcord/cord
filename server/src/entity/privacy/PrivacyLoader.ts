import { QueryTypes } from 'sequelize';
import type { Transaction } from 'sequelize';
import type { RequestContextLoadersInternal } from 'server/src/RequestContextLoaders.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasPlatformApplicationID,
  assertViewerHasUser,
  viewerIsUsingOrgsAsFilter,
} from 'server/src/auth/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { Permission } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  getTypedFeatureFlagValue,
  flagsUserFromViewer,
  FeatureFlags,
} from 'server/src/featureflags/index.ts';
import { Logger } from 'server/src/logging/Logger.ts';

/**
 * Unlike most loaders, this loader SHOULD NOT be called directly (only from
 * other loaders) -- you shouldn't be needing to directly evaluate low-level
 * privacy, but rather the other loaders should be doing it for you before
 * returning their results.
 */
export class PrivacyLoader {
  constructor(
    private viewer: Viewer,
    private loaders: () => RequestContextLoadersInternal,
  ) {}

  private async granularPermissionsEnabled() {
    return await getTypedFeatureFlagValue(
      FeatureFlags.GRANULAR_PERMISSIONS,
      flagsUserFromViewer(this.viewer),
    );
  }

  private async viewerPermissionJson(transaction?: Transaction) {
    // TODO: refactor UserLoader.loadUser so that it can take a Transaction, and
    // then call it here.
    const user = await UserEntity.findByPk(assertViewerHasUser(this.viewer), {
      transaction,
    });

    if (!user) {
      throw new Error('Could not load our own user?');
    }

    return await this.userPermissionJson(user, transaction);
  }

  private async userPermissionJson(
    user: UserEntity,
    _transaction?: Transaction,
  ) {
    return { id: user.externalID, metadata: user.metadata };
  }

  private async threadPermissionJson(
    thread: ThreadEntity,
    _transaction?: Transaction,
  ) {
    return {
      id: thread.externalID,
      metadata: thread.metadata,
    };
  }

  private async messagePermissionJson(message: MessageEntity) {
    return {
      id: message.externalID,
      metadata: message.metadata,
    };
  }

  private async hasMatchingPermissionRule(
    userJson: unknown,
    resourceJson: unknown,
    permission: Permission,
    transaction?: Transaction,
  ) {
    const rules = await getSequelize().query(
      `SELECT id FROM permission_rules
          WHERE "platformApplicationID" = $1
          AND $2 @@ "userSelector"
          AND $3 @@ "resourceSelector"
          AND $4 = ANY("permissions")
          LIMIT 1`,
      {
        bind: [
          assertViewerHasPlatformApplicationID(this.viewer),
          userJson,
          resourceJson,
          permission,
        ],
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    return rules.length > 0;
  }

  async viewerHasThread(
    thread: ThreadEntity | null,
    strictOrgCheck: boolean,
    transaction?: Transaction,
  ): Promise<boolean> {
    if (!thread) {
      return false;
    }

    if (strictOrgCheck) {
      const orgIDs = assertViewerHasOrgs(this.viewer);
      if (orgIDs.includes(thread.orgID)) {
        return true;
      }

      if (viewerIsUsingOrgsAsFilter(this.viewer)) {
        return false;
      }
    } else {
      const canAccess =
        await this.loaders().orgMembersLoader.viewerCanAccessOrg(
          thread.orgID,
          transaction,
        );
      if (canAccess) {
        return true;
      }
    }

    const enablePerms = await this.granularPermissionsEnabled();
    const { platformApplicationID } = this.viewer;
    if (enablePerms && platformApplicationID) {
      const [userJson, threadJson] = await Promise.all([
        this.viewerPermissionJson(transaction),
        this.threadPermissionJson(thread, transaction),
      ]);
      const hasRule = await this.hasMatchingPermissionRule(
        userJson,
        threadJson,
        'thread:read',
        transaction,
      );

      if (hasRule) {
        return true;
      }
    }

    return false;
  }

  async viewerHasMessage(message: MessageEntity | null): Promise<boolean> {
    if (!message) {
      return false;
    }

    const thread = await this.loaders().threadLoader.loadThread(
      message.threadID,
    );

    if (!thread) {
      return false;
    }

    const enablePerms = await this.granularPermissionsEnabled();
    if (!enablePerms) {
      // In the old model, if you can see a thread, you can see all of its
      // messages.
      return true;
    }

    if (
      await this.loaders().orgMembersLoader.viewerCanAccessOrg(message.orgID)
    ) {
      return true;
    }

    const [userJson, threadJson, messageJson] = await Promise.all([
      this.viewerPermissionJson(),
      this.threadPermissionJson(thread),
      this.messagePermissionJson(message),
    ]);

    const [hasThreadRule, hasMessageRule] = await Promise.all([
      this.hasMatchingPermissionRule(userJson, threadJson, 'message:read'),
      this.hasMatchingPermissionRule(userJson, messageJson, 'message:read'),
    ]);

    if (hasThreadRule || hasMessageRule) {
      return true;
    }

    return false;
  }

  async viewerHasParticipant(
    participant: ThreadParticipantEntity | null,
  ): Promise<boolean> {
    if (!participant) {
      return false;
    }

    // Can always see your own participation.
    if (participant.userID === this.viewer.userID) {
      return true;
    }

    const thread = await this.loaders().threadLoader.loadThread(
      participant.threadID,
    );
    if (!thread) {
      return false;
    }

    // In the pre-permissions world, can see all participants. (This check is
    // not strictly necessary -- the one immediately below should always return
    // true since you must be a member of the org to see and send to the thread
    // -- but being defensive.)
    const enablePerms = await this.granularPermissionsEnabled();
    if (!enablePerms) {
      return true;
    }

    // You can always see the participation from people who participate in the
    // thread by right of being a member of the thread's org. (Simple, legacy,
    // pre-permission model.)
    const participantMembershipInThreadOrg =
      await this.loaders().orgMembersLoader.loadUserOrgMembership(
        participant.userID,
        thread.orgID,
      );
    if (participantMembershipInThreadOrg) {
      return true;
    }

    const participantUser = await this.loaders().userLoader.loadUser(
      participant.userID,
    );
    if (!participantUser) {
      return false;
    }

    const [userJson, threadJson, participantUserJson] = await Promise.all([
      this.viewerPermissionJson(),
      this.threadPermissionJson(thread),
      this.userPermissionJson(participantUser),
    ]);

    const [hasThreadRule, hasParticipantUserRule] = await Promise.all([
      this.hasMatchingPermissionRule(
        userJson,
        threadJson,
        'thread-participant:read',
      ),
      this.hasMatchingPermissionRule(
        userJson,
        participantUserJson,
        'thread-participant:read',
      ),
    ]);

    if (hasThreadRule || hasParticipantUserRule) {
      return true;
    }

    return false;
  }

  async viewerCanSendMessageToThread(
    thread: ThreadEntity,
    transaction?: Transaction,
  ): Promise<boolean> {
    const [canSeeThread, enablePerms] = await Promise.all([
      this.viewerHasThread(thread, false, transaction),
      this.granularPermissionsEnabled(),
    ]);

    if (!enablePerms) {
      if (!canSeeThread) {
        // This should return false, but I'm not confident in all of the
        // callsites / Slack linking / etc, so let's make sure before we break
        // things.
        new Logger(this.viewer).warn(
          `Privacy logic error: sending to thread viewer cannot see: ${thread.id}`,
        );
      }

      return true;
    }

    // You can't send messages to threads you can't read. We could relax this in
    // the future -- it's a little weird to have a write-only thread, but it's
    // meaningful enough there could be use-cases for it. However, for now, it's
    // a lot simpler to both reason about and code if you assume you can always
    // see the thread if you're manipulating it in any way.
    if (!canSeeThread) {
      return false;
    }

    const canAccessOrg =
      await this.loaders().orgMembersLoader.viewerCanAccessOrg(
        thread.orgID,
        transaction,
      );
    if (canAccessOrg) {
      return true;
    }

    const [userJson, threadJson] = await Promise.all([
      this.viewerPermissionJson(transaction),
      this.threadPermissionJson(thread, transaction),
    ]);
    return await this.hasMatchingPermissionRule(
      userJson,
      threadJson,
      'thread:send-message',
      transaction,
    );
  }
}
