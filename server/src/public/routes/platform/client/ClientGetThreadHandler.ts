import type { Request, Response } from 'express';
import type { ClientThreadData } from '@cord-sdk/types';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeThreadByExternalID2Query } from 'server/src/schema/operations.ts';
import {
  getMessageData,
  getThreadSummary,
} from 'common/util/convertToExternal/thread.ts';
import {
  collectNeededUserIDs,
  getUserByInternalIdFunction,
} from 'server/src/public/routes/platform/client/util.ts';

// fetchMore is a function, which we can't return, and summary is deprecated and
// we can safely omit it for this interface
type RestClientThreadData = Omit<ClientThreadData, 'summary' | 'fetchMore'>;

async function getClientThreadHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const initialFetchCount = req.query.initialFetchCount
    ? Number.parseInt(req.query.initialFetchCount as string)
    : undefined;
  if (isNaN(initialFetchCount ?? 0)) {
    throw new ApiCallerError('invalid_field', {
      message: `initialFetchCount must be a number.`,
    });
  }

  const threadGraphQL = await executeThreadByExternalID2Query({
    context,
    variables: {
      _externalOrgID: undefined,
      input: {
        externalThreadID: req.params.threadID,
      },
      initialFetchCount,
    },
  });

  if (!threadGraphQL.threadByExternalID2.thread) {
    throw new ApiCallerError('thread_not_found');
  }

  const thread = threadGraphQL.threadByExternalID2.thread;

  const userByInternalID = await getUserByInternalIdFunction(
    context,
    collectNeededUserIDs(thread),
  );

  const messages = thread.initialMessagesInclDeleted.map((message) =>
    getMessageData({ message, thread, userByInternalID }),
  );
  const allMessagesFetched = messages.length === thread.allMessagesCount;
  if (!allMessagesFetched) {
    // By default, our GraphQL queries always return the first message of the
    // thread, along with the last N messages (for whatever N we have loaded).
    // This is useful for our own UI, but is a bit awkward as an API -- the
    // calling code has to know that there can be a "gap" between messages[0]
    // and messages[1]. So let's not do that, remove messages[0] to eliminate
    // that gap (unless we have the entire rest of the thread in which case
    // there is no gap).
    messages.shift();
  }

  const result: RestClientThreadData = {
    thread: getThreadSummary(
      { ...thread, messages: thread.initialMessagesInclDeleted },
      userByInternalID,
    ),
    messages,
    loading: false,
    hasMore: !allMessagesFetched,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientThreadHandler);
