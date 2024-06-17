import type {
  PreferencesType,
  PreferencesValueType,
  UUID,
} from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';

export class UserPreferenceLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadPreferences(): Promise<PreferencesType> {
    const userID = assertViewerHasUser(this.viewer);

    const entities = await UserPreferenceEntity.findAll({
      where: {
        userID,
      },
    });

    return Object.fromEntries(entities.map(({ key, value }) => [key, value]));
  }

  async loadPreferenceValueForViewer<T extends PreferencesValueType>(
    key: string,
  ): Promise<T | undefined> {
    const userID = assertViewerHasUser(this.viewer);

    return await this.loadPreferenceValueForUser(key, userID);
  }

  async loadPreferenceValueForUser<T extends PreferencesValueType>(
    key: string,
    userID: UUID,
  ): Promise<T | undefined> {
    const entity = await UserPreferenceEntity.findOne({
      where: { userID, key },
    });

    if (!entity) {
      return undefined;
    }

    return entity.value as T;
  }
}
