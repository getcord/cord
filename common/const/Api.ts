// How many messages to load when you first open a channel
export const INITIAL_MESSAGES_COUNT = 20;

// How many more to load on button press for threads
export const THREAD_LOAD_MORE_MESSAGES_COUNT = 10;

// How long the redirect ID is
export const NOTIFICATION_LOGGING_REDIRECT_ID_LENGTH = 21;

// How many users to load when querying users by name for mention list
// (Per org, so max 20 for platform and max 20 for Slack, if connected)
export const MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS = 20;

// Controls for how large the page size can be when fetching lists of threads
export const DEFAULT_THREAD_INITIAL_PAGE_SIZE = 10;
export const THREAD_INITIAL_PAGE_SIZE_LIMIT = 1000;

// Controls for the page loads when fetching lists of notifications
export const DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE = 10;

// Controls for the page loads when fetching lists of group members
export const DEFAULT_GROUP_MEMBERS_INITIAL_PAGE_SIZE = 10;
