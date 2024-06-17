import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useAutocompleteQuery } from 'external/src/graphql/operations.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';

/**
 * Returns an array of users sorted by page visitors, team member, and then the viewer
 */
export function useGetPageVisitorsAndUsers() {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const orgID = organization?.externalID;

  const { data: autocompleteData, loading } = useAutocompleteQuery({
    skip: !orgID,
    variables: {
      _externalOrgID: orgID!,
      nameQuery: null,
      sortUsersBy: pageContext?.data,
      sortUsersDirection: 'descending',
    },
  });

  // Wait til org members are loaded to return any list of users.  This hook
  // returns the viewer as well as other types of users, and it causes a flicker
  // in facepiles etc if it first returns just the user and then a moment later
  // the org members too.
  if (!user || loading) {
    return [];
  }

  const teamExcludingUser: UserFragment[] =
    autocompleteData?.organizationByExternalID?.usersWithOrgDetails.filter(
      (teamMember) => teamMember.id !== user.id,
    ) ?? [];

  return teamExcludingUser.concat([user]);
}
