import type {
  JiraAuthData,
  LinearAuthData,
} from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { getExternalAuthData } from 'server/src/third_party_tasks/util.ts';
import { canUserEditTask } from 'server/src/third_party_tasks/linear/actions.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const taskThirdPartyReferenceResolver: Resolvers['TaskThirdPartyReference'] =
  {
    type: (reference) => reference.externalConnectionType,
    canEdit: async (reference, _args, context) => {
      const authData = await getExternalAuthData(
        context.session.viewer,
        reference.externalConnectionType,
      );
      if (!authData) {
        // the viewer isn't even connected to the provider type of this external task
        return false;
      }

      switch (reference.externalConnectionType) {
        case 'jira': {
          // check if the viewer's connection is for the same cloud instance
          const externalTaskCloudID = reference.externalLocationID;
          const { cloudID } = authData as JiraAuthData;
          return cloudID === externalTaskCloudID;
        }
        case 'linear': {
          const { accessToken } = authData as LinearAuthData;
          const teamID = reference.externalLocationID;
          return await canUserEditTask(
            accessToken,
            teamID!,
            context.session.viewer,
          );
        }
        default:
          // TODO: add provider-specific checks
          return true;
      }
    },
  };
