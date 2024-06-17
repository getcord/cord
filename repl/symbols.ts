import type { Model, ModelCtor } from 'sequelize-typescript';
import { CORD_SDK_TEST_APPLICATION_ID } from 'common/const/Ids.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { MessageLoader } from 'server/src/entity/message/MessageLoader.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import {
  FeatureFlags,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { LinkedOrgsLoader } from 'server/src/entity/linked_orgs/LinkedOrgsLoader.ts';
import { LinkedUsersLoader } from 'server/src/entity/linked_users/LinkedUsersLoader.ts';

const symbols: { name: string }[] = [
  getSequelize,
  getTypedFeatureFlagValue,
  LinkedOrgsLoader,
  LinkedUsersLoader,
  MessageLoader,
  MessageMutator,
  ThreadLoader,
  ThreadMutator,
  UserLoader,
  UserMutator,
  Viewer,
];

export default async function defineSymbols(
  defineSymbol: (name: string, def: unknown) => void,
) {
  for (const model of getSequelize().options.models!) {
    defineSymbol((model as ModelCtor<Model<never, never>>).name, model);
  }

  for (const symbol of symbols) {
    defineSymbol(symbol.name, symbol);
  }

  defineSymbol('FeatureFlags', FeatureFlags);

  const [andreiUser, cordOrg] = await Promise.all([
    UserEntity.findOne({
      where: {
        externalID: 'andrei',
        platformApplicationID: CORD_SDK_TEST_APPLICATION_ID,
      },
    }),
    OrgEntity.findOne({
      where: {
        externalID: 'cord',
        platformApplicationID: CORD_SDK_TEST_APPLICATION_ID,
      },
    }),
  ]);
  defineSymbol(
    'andreiViewer',
    await Viewer.createLoggedInPlatformViewer({
      user: andreiUser!,
      org: cordOrg!,
    }),
  );
}
