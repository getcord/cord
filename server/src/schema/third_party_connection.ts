import { encodeViewerForOAuthState } from 'server/src/auth/oauth.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { getLinearUserTeamInfo } from 'server/src/third_party_tasks/linear/actions.ts';
import { fetchJiraProjects } from 'server/src/third_party_tasks/jira/actions.ts';
import { getTrelloWorkSpace } from 'server/src/third_party_tasks/trello/actions.ts';
import { fetchAsanaProjects } from 'server/src/third_party_tasks/asana/actions.ts';
import { fetchMondayBoards } from 'server/src/third_party_tasks/monday/actions.ts';
import type {
  Resolvers,
  ThirdPartyConnectionType,
} from 'server/src/schema/resolverTypes.ts';

export type ThirdPartyConnectionArguments = {
  type: ThirdPartyConnectionType;
};
export const thirdPartyConnectionResolver: Resolvers['ThirdPartyConnection'] = {
  connected: async ({ type }, _, context) => {
    const { userID, orgID } = assertViewerHasIdentity(context.session.viewer);
    const entity = await ThirdPartyConnectionEntity.findOne({
      where: { userID, orgID, type },
    });

    return entity !== null;
  },
  oAuthStateToken: ({ type }, _, context) =>
    encodeViewerForOAuthState(context.session.viewer, type),
  configuration: async ({ type }, _, context) => {
    switch (type) {
      case 'jira': {
        return await fetchJiraProjects(context.session.viewer);
      }
      case 'linear': {
        return await getLinearUserTeamInfo(context.session.viewer);
      }
      case 'trello': {
        return await getTrelloWorkSpace(context.session.viewer);
      }
      case 'asana': {
        return await fetchAsanaProjects(context.session.viewer);
      }
      case 'monday':
        return await fetchMondayBoards(context.session.viewer);
      default: {
        return [];
      }
    }
  },
};
