import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { HeimdallMutator } from 'server/src/entity/heimdall/HeimdallMutator.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const flipHeimdallSwitchResolver: Resolvers['Mutation']['flipHeimdallSwitch'] =
  async (_, args, context) => {
    const mutator = new HeimdallMutator(
      context.session.viewer,
      context.loaders.heimdallLoader,
    );

    const userID = assertViewerHasUser(context.session.viewer);

    const user = await UserEntity.findByPk(userID);

    const userName = user!.externalID ? `<@${user!.externalID}>` : user!.name;

    const success = await mutator.changeOnOffSwitchState(args.key, args.value);

    if (
      success &&
      process.env.CORD_TIER === 'prod' &&
      process.env.PROD_CHANGES_SLACK_CHANNEL_ID
    ) {
      backgroundPromise(
        sendMessageToCord(
          `${userName} flipped a <https://admin.cord.com/heimdall|Heimdall switch>: *${
            args.key
          }* is now *${args.value.toString().toUpperCase()}* ${
            args.value === true ? '✅' : '❌'
          }`,
          process.env.PROD_CHANGES_SLACK_CHANNEL_ID,
        ),
      );
    }

    return {
      success,
      failureDetails: null,
    };
  };
