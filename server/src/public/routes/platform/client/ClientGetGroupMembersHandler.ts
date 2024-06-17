import type { Request, Response } from 'express';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeOrgMembersByExtIDPaginatedQuery } from 'server/src/schema/operations.ts';
import type { GroupMembersData } from '@cord-sdk/types';
import { DEFAULT_GROUP_MEMBERS_INITIAL_PAGE_SIZE } from 'common/const/Api.ts';
import { usersToUserData } from 'common/util/convertToExternal/user.ts';

// fetchMore is a function, which we can't return
type RestGroupMembersData = Omit<GroupMembersData, 'fetchMore'>;

async function getClientGroupMembersHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const data = await executeOrgMembersByExtIDPaginatedQuery({
    context,
    variables: {
      externalOrgID: req.params.groupID,
      limit: DEFAULT_GROUP_MEMBERS_INITIAL_PAGE_SIZE,
      after: undefined,
    },
  });

  const result: RestGroupMembersData = {
    groupMembers: usersToUserData(data.orgMembersByExternalIDPaginated.users),
    loading: false,
    hasMore: data.orgMembersByExternalIDPaginated.hasMore,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientGroupMembersHandler);
