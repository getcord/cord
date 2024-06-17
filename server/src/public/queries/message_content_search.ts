import { QueryTypes } from 'sequelize';
import type { Location } from 'common/types/index.ts';
import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { isDefined } from 'common/util/index.ts';
import type { SearchSortByOptions, SortDirection } from '@cord-sdk/types';

export const messageContentSearchResolver: Resolvers['Query']['messageContentSearch'] =
  async (_, args, context) => {
    const {
      textToMatch: searchText,
      authorExternalID,
      orgExternalID,
      locationOptions,
      timestampRange,
      metadata,
      limit,
      sortBy,
      sortDirection,
    } = args;

    const appID = assertViewerHasPlatformApplicationID(context.session.viewer);

    if (
      !searchText &&
      !authorExternalID &&
      !orgExternalID &&
      !locationOptions &&
      !timestampRange &&
      !metadata
    ) {
      return [];
    }

    const extraConditions = [];
    const extraJoins = [];
    const bindVariables: (string | string[] | Location | Date)[] = [appID];

    let subquery = '';
    const allOrgsForUser =
      await context.loaders.orgMembersLoader.loadAllImmediateOrgIDsForUser();

    if (orgExternalID) {
      const orgData = await context.loaders.orgLoader.loadPlatformOrg(
        appID,
        orgExternalID,
      );

      if (!orgData) {
        context.logger.warn('Unable to find specified org external ID', {
          orgExternalID,
        });
        // return early if no org match found
        return [];
      }

      const isOrgMember = allOrgsForUser.includes(orgData.id);
      if (!isOrgMember) {
        context.logger.warn('User is not a member of org', {
          orgExternalID,
        });
        // return early if user is not in org
        return [];
      } else {
        bindVariables.push(orgData.id);
        extraConditions.push(`m."orgID" = $${bindVariables.length}`);
      }
    } else {
      bindVariables.push(allOrgsForUser);
      // if no orgExternalID search option specified - search across all the users' orgs
      extraConditions.push(`m."orgID" = ANY($${bindVariables.length})`);
    }

    if (authorExternalID) {
      const internalUserID = (
        await context.loaders.userLoader.loadUserByExternalID(
          appID,
          authorExternalID,
        )
      )?.id;

      if (!internalUserID) {
        context.logger.warn('Unable to find specified author external ID', {
          authorExternalID,
        });
        // return early if no author match found
        return [];
      } else {
        bindVariables.push(internalUserID);
        extraConditions.push(`"sourceID" = $${bindVariables.length}`);
      }
    }
    if (locationOptions) {
      extraJoins.push(`INNER JOIN threads t
      ON (t.id = m."threadID")
      INNER JOIN pages p
      ON (p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`);
      bindVariables.push(locationOptions.location);
      extraConditions.push(
        `p."contextData" ${locationOptions.partialMatch ? '@>' : '='} $${
          bindVariables.length
        }::jsonb`,
      );
    }

    if (metadata) {
      bindVariables.push(metadata);
      extraConditions.push(`m.metadata @> $${bindVariables.length}::jsonb`);
    }

    if (timestampRange) {
      if (timestampRange.from && !isNaN(timestampRange.from.getTime())) {
        bindVariables.push(timestampRange.from);
        extraConditions.push(
          `m.timestamp >= $${bindVariables.length}::timestamp`,
        );
      }
      if (timestampRange.to && !isNaN(timestampRange.to.getTime())) {
        bindVariables.push(timestampRange.to);
        extraConditions.push(
          `m.timestamp <= $${bindVariables.length}::timestamp`,
        );
      }
    }

    if (searchText) {
      bindVariables.push(searchText);
      subquery = `WITH search AS (
        SELECT to_tsquery(string_agg(lexeme || ':*', ' & ' order by positions)) AS query
        FROM unnest(to_tsvector('english', $${bindVariables.length}))
    )`;
      extraConditions.push(`"contentTsVector" @@ search.query`);
    }

    const extraCondition =
      extraConditions.length > 0 ? `AND ${extraConditions.join(' AND ')}` : '';
    const extraJoin = extraJoins.join(' ');
    // Make sure the limit isn't above 1000 but if not provided default to 50
    const limitCondition = `LIMIT ${
      isDefined(limit) && limit >= 0 ? Math.min(limit, 1000) : 50
    }`;

    // For this query we'll create a CTE we can use to get the search results
    // we first convert the search term to a lexeme using to_tsvector then
    // create a regex  string from the individual tokens by
    // appending :* to allow us to perform a prefix search
    // and using the & operator to join the words to allow us to do a phrase search

    // the @@ operator is then used to compare 'contentTsVector' data with an object
    // generated by the to_tsquery function.
    // NOTE: we limit the results from this query for now until we have a think on pagination

    // eg: ('good bad') becomes good:* & bad:* which we can use directly
    // with to_tsquery to get fuzzy matching.

    // To make sure our search results are always relevant, we will always order by rank first
    // and then do an outer ordering by timestamp or any other sortBy value.
    // That way, we always have relevant search results which are potentially ordered if
    // requested by the user, rather than returning correctly ordered messages but with least relevance.
    const { orderCondition, additionalOrderCondition } =
      getSearchSortingConditions({ sortBy, sortDirection, searchText });

    // we will only order by relevance if there's a searchText provided, hence the 'maybe'
    const queryToMaybeGetMostRelevantMessages = `SELECT m.*
    ${searchText ? ', ts_rank(m."contentTsVector", search.query) AS rank' : ''}
    FROM messages m
    ${extraJoin}
    ${searchText ? ', search' : ''}
    WHERE m."platformApplicationID" = $1
    AND m."deletedTimestamp" IS NULL
    ${extraCondition}
    ${orderCondition}
    ${limitCondition}`;

    // Add the addition ordering on top of the messages from
    // intial query to get messages sorted by most relevant
    const messages = await context.sequelize.query<MessageEntity>(
      `
      ${subquery}
      SELECT * FROM (
        ${queryToMaybeGetMostRelevantMessages}
      ) AS messages
      ${additionalOrderCondition}
    `,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
        model: MessageEntity,
      },
    );

    return messages;
  };

/*
  Method to use in the message_content_search query to get the correct sql ORDER query

  note:
  We'll always be sorting the results by search ranking regardless of the sortBy
  param passed down by the user - that way, we always have the most relevant
  search results on top before adding our limit or timestamp/other sorting.
  Unless, we there is no searchText which means there's no relevance so we'll
  order by most recent messages first.

  This function will take the sort parameters and return the correct 
  ORDER to use for the internal and extranal queries.

  returns: 
  {
    orderCondition - the internal query's order (where the messages alias is 'm')
    additionalOrderCondition - external query's order
  }
*/
function getSearchSortingConditions({
  sortBy,
  sortDirection,
  searchText,
}: {
  sortBy?: SearchSortByOptions | null;
  sortDirection?: SortDirection | null;
  searchText?: string | null;
}): {
  orderCondition: string;
  additionalOrderCondition: string;
} {
  const sortDirectionValue = sortDirection === 'ascending' ? 'ASC' : 'DESC';

  // only sort once, by timestamp if there's no search term to provide relevance to.
  const sortByValue = sortBy === 'created_timestamp' ? 'timestamp' : 'rank';
  const additionalOrderCondition = searchText
    ? `ORDER by ${sortByValue} ${sortDirectionValue}`
    : '';

  return {
    orderCondition: searchText
      ? `ORDER BY rank DESC`
      : `ORDER BY m.timestamp ${sortDirectionValue}`,
    additionalOrderCondition,
  };
}
