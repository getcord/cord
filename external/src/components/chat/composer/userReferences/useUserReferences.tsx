import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Editor } from 'slate';
import { Range } from 'slate';
import { ReactEditor } from 'slate-react';
import { debounce } from 'radash';
import type { UserWithOrgDetails, UUID } from 'common/types/index.ts';
import { UserReference } from 'common/types/index.ts';
import { useLazyAutocompleteQuery } from 'external/src/graphql/operations.ts';
import { getUserReferenceSearchParameters } from 'external/src/components/chat/composer/userReferences/util.ts';

import { EditorCommands } from 'external/src/editor/commands.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { NudgeType } from 'external/src/lib/nudge.ts';
import { useNudgeState } from 'external/src/effects/useNudgeState.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ConnectToSlackMenuItem } from 'external/src/components/ConnectToSlackMenuItem.tsx';
import { UnshownUserCountText } from 'external/src/components/UnshownUserCountText.tsx';
import { UserReferenceSuggestions2 } from 'external/src/components/2/UserReferenceSuggestions2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';

import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS } from 'common/const/Api.ts';
import { useIsSlackConnected } from 'external/src/effects/useIsSlackConnected.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';

const emptyArr: UUID[] = [];

export const useUserReferences = ({
  editor,
  externalOrgID,
  requestMentionableUsers,
  referenceType,
  excludedUserIDs = emptyArr,
}: {
  editor: Editor;
  externalOrgID: string | undefined;
  requestMentionableUsers: boolean; // Only needed if the user will be able to @-mention (at the moment this hook is called whenever useComposerController is called, which isn't only from a composer)
  referenceType?: UserReference;
  excludedUserIDs?: UUID[];
}) => {
  const [userReferenceRange, setUserReferenceRange] = useState<Range>();
  const [userReferenceSearch, setUserReferenceSearch] = useState<string>();
  const [selectedUserReferenceIndex, setSelectedUserReferenceIndex] =
    useState(0);
  const [userReferenceType, setUserReferenceType] = useState<UserReference>();
  const {
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { enableTasks } = useContextThrowingIfNoProvider(ConfigurationContext);

  const { isOrgConnected } = useIsSlackConnected();

  const connectToSlackPrompt = useMemo(() => {
    // The `ConnectToSlackMenuItem` component will render as nothing if the
    // org is connected to Slack already or Slack connecting is disabled
    return (
      <ConnectToSlackMenuItem
        editor={editor}
        isSlackWorkspaceConnected={isOrgConnected}
      />
    );
  }, [editor, isOrgConnected]);

  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const { logEvent } = useLogger();

  // Although we are using a lazy query, the useEffect below will run the query
  // on load with an empty nameQuery value, which will match against any user
  // (subject to a limit) and so provide an initial load of users to display
  const [autocompleteQuery, { data, previousData, loading }] =
    useLazyAutocompleteQuery();

  const { userReferenceUsers, unshownUserCount } = useMemo(() => {
    // When the query is rerun (which it is, frequently, when the user is typing)
    // data becomes undefined and loading becomes true.  To avoid the list closing
    // momentarily and then reopening with the new results, use previousData
    // while loading is happening
    const autocompleteData = loading ? previousData : data;

    if (!autocompleteData?.organizationByExternalID?.usersWithOrgDetails) {
      return { userReferenceUsers: [], unshownUserCount: undefined };
    }

    let consolidatedUsersFromBackend: UserWithOrgDetails[];

    // IDs of Slack users which are already linked to or email matched with a
    // platform user that has been loaded.  Note that this is only based on which
    // platform users are returned by the search - it is possible that e.g. a
    // platform user is linked to a Slack user but they have different names in the
    // db - the Slack user could be returned but not the platform user, and we would
    // show the Slack profile (whereas previously we would show the platform user,
    // albeit probably with Slack profile details)
    const slackUserIdsNotToInclude = new Set<UUID>();
    const deduplicatedUsers = [];

    if (!autocompleteData.organizationByExternalID.linkedOrganization) {
      // No linked org - just return all platform users
      consolidatedUsersFromBackend =
        autocompleteData.organizationByExternalID.usersWithOrgDetails;
    } else {
      // Linked org: we need to show platform users and Slack users which aren't
      // explicitly or implicitly (email) linked to the platform users we found
      for (const platformUser of autocompleteData.organizationByExternalID
        .usersWithOrgDetails) {
        deduplicatedUsers.push(platformUser);
        if (platformUser.linkedUserID) {
          slackUserIdsNotToInclude.add(platformUser.linkedUserID);
        }
        if (platformUser.slackUserWithMatchingEmail) {
          slackUserIdsNotToInclude.add(platformUser.slackUserWithMatchingEmail);
        }
      }
      for (const slackUser of autocompleteData.organizationByExternalID
        .linkedOrganization.usersWithOrgDetails) {
        if (!slackUserIdsNotToInclude.has(slackUser.id)) {
          deduplicatedUsers.push(slackUser);
        }
      }
      consolidatedUsersFromBackend = deduplicatedUsers;
    }

    const usersToShow = consolidatedUsersFromBackend
      .filter((u) => !excludedUserIDs.includes(u.id))
      .slice(0, MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS * 2);

    return {
      userReferenceUsers: usersToShow,
      unshownUserCount: undefined,
    };
  }, [data, excludedUserIDs, loading, previousData]);

  const getMentionableUsersNewWay = useCallback(
    (query: string) => {
      if (externalOrgID && requestMentionableUsers) {
        void autocompleteQuery({
          variables: {
            _externalOrgID: externalOrgID,
            nameQuery: query,
            sortUsersBy: pageContext?.data,
            sortUsersDirection: 'descending',
          },
        });
      }
    },
    [autocompleteQuery, externalOrgID, pageContext, requestMentionableUsers],
  );

  const throttledFetch = useMemo(() => {
    return debounce({ delay: 50 }, (search: string | undefined) => {
      getMentionableUsersNewWay(search ?? '');
    });
  }, [getMentionableUsersNewWay]);

  useEffect(() => {
    throttledFetch(userReferenceSearch);
    // isSlackWorkspaceConnected is added to the dependency array to make sure
    // we refetch when a user connects or disconnects from Slack
  }, [throttledFetch, userReferenceSearch, isOrgConnected]);

  const { dismissNudge } = useNudgeState();

  const insertUserReference = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const user = userReferenceUsers[selectedUserReferenceIndex];
    if (userReferenceRange && userReferenceType) {
      requestUsers(user.id);

      ReactEditor.focus(editor);
      EditorCommands.replaceRangeWithUserReference(
        userReferenceType,
        editor,
        userReferenceRange,
        user,
      );
      setUserReferenceRange(undefined);
      editor.insertText(' ');
    }

    logEvent(`insert-${userReferenceType!}`, { userID: user.id });
    if (userReferenceType === UserReference.MENTION) {
      dismissNudge(NudgeType.MENTION);
    }
  }, [
    requestUsers,
    userReferenceUsers,
    selectedUserReferenceIndex,
    userReferenceRange,
    logEvent,
    dismissNudge,
    userReferenceType,
    editor,
  ]);

  const closeUserReferences = useCallback(() => {
    setUserReferenceSearch(undefined);
    setUserReferenceRange(undefined);
    setSelectedUserReferenceIndex(0);
    setUserReferenceType(undefined);
  }, []);

  const selectNext = useCallback(() => {
    setSelectedUserReferenceIndex(
      (prev) => (prev + 1) % userReferenceUsers.length,
    );
  }, [userReferenceUsers.length]);

  const selectPrev = useCallback(() => {
    setSelectedUserReferenceIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? userReferenceUsers.length - 1 : next;
    });
  }, [userReferenceUsers.length]);

  const updateUserReferences = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (editor: Editor) => {
      const { selection } = editor;

      if (selection && Range.isCollapsed(selection)) {
        const userReferenceSearchParameters = getUserReferenceSearchParameters(
          editor,
          enableTasks,
          referenceType,
        );
        if (userReferenceSearchParameters) {
          setUserReferenceSearch(
            userReferenceSearchParameters.search !== undefined
              ? userReferenceSearchParameters.search.toLowerCase()
              : undefined,
          );
          setUserReferenceRange(userReferenceSearchParameters.range);
          setSelectedUserReferenceIndex(0);
          setUserReferenceType(userReferenceSearchParameters.type);
        } else {
          closeUserReferences();
        }
      }
    },
    [closeUserReferences, referenceType, enableTasks],
  );

  const currentValueRef = useUpdatingRef(userReferenceSearch);

  const unshownUserCountLine = useMemo(() => {
    return unshownUserCount && unshownUserCount > 0 ? (
      <UnshownUserCountText unshownUserCount={unshownUserCount} />
    ) : null;
  }, [unshownUserCount]);

  const menuElement = useMemo(() => {
    return (
      <UserReferenceSuggestions2
        users={userReferenceUsers}
        selectedIndex={selectedUserReferenceIndex}
        setUserReferenceIndex={setSelectedUserReferenceIndex}
        onSuggestionClicked={insertUserReference}
        connectToSlackPrompt={connectToSlackPrompt}
        unshownUserCountLine={unshownUserCountLine}
      />
    );
  }, [
    insertUserReference,
    selectedUserReferenceIndex,
    userReferenceUsers,
    connectToSlackPrompt,
    unshownUserCountLine,
  ]);

  return useMemo(
    () => ({
      userReferenceMenuOpen: Boolean(
        userReferenceRange && userReferenceUsers.length > 0,
      ),
      userReferenceUsers,
      insertUserReference,
      closeUserReferences,
      selectNext,
      selectPrev,
      updateUserReferences,
      userReferenceType,
      currentValueRef,
      menuElement,
    }),
    [
      closeUserReferences,
      insertUserReference,
      userReferenceRange,
      userReferenceUsers,
      selectNext,
      selectPrev,
      updateUserReferences,
      userReferenceType,
      currentValueRef,
      menuElement,
    ],
  );
};
