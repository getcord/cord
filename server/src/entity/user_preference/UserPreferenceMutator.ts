import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { PreferencesValueType, UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';

export class UserPreferenceMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async setViewerPreference(
    key: string,
    value: PreferencesValueType,
  ): Promise<void> {
    const userID = assertViewerHasUser(this.viewer);
    return await this.setPreferenceForUser(userID, key, value);
  }

  async setPreferenceForUser(
    userID: UUID,
    key: string,
    value: PreferencesValueType,
  ): Promise<void> {
    const entity = await UserPreferenceEntity.findOne({
      where: { userID, key },
    });
    const changed = !entity || !isEqual(entity.value, value);
    if (!changed) {
      return;
    }
    await UserPreferenceEntity.upsert({
      userID,
      key,
      value,
    });

    await publishPubSubEvent('user-preference-updated', { userID }, { key });
  }
}
