export enum FeatureFlag {
  LOG_GRAPHQL_TO_CONSOLE = 'log_graphql_to_console',
  DEEP_LINK_MESSAGE_FROM_NOTIFICATION = 'deep_link_message_from_notification',
  QUERY_PARAM_DEEP_LINKS = 'query_param_deep_links',
  QUERY_PARAM_DEEP_LINKS_IN_SHARE_TO_SLACK = 'query_param_deep_links_in_share_to_slack',
  EMAIL_SHARING = 'email_sharing',
}
// FEATURE_NAME = 'feature_featureName',

// For storing wether the welcome page in the NUX flow has been seen
export const NUX_WELCOME_PAGE_SEEN = 'nux_init_welcome_page_seen';

// For collapsing the steps that you have in the NUX workspace page
export const NUX_STEPS_COLLAPSED = 'nux_init_steps_collapsed';

// For dismissing the completed steps that you have in the NUX workspace page
export const NUX_STEPS_DISMISSED = 'nux_init_steps_dismissed';

// For persisting the information that the user has watched the nux video
export const NUX_VIDEO_WATCHED = 'nux_init_video_watched';

// For persisting the information that the user has opened the Slack info modal
export const NUX_SLACK_INFO_OPENED = 'nux_slack_info_opened';

// For showing and hiding the message debug
export const ENABLE_MESSAGE_DEBUG = 'enable_message_debug';

// For showing and hiding the thread debug
export const ENABLE_THREAD_DEBUG = 'enable_thread_debug';

// For storing the last channel a user shared to, so we can use that as the default option
export const SLACK_CHANNEL_IDS_SHARED_TO = 'slack_channel_ids_shared_to';

// For storing the Jira connection configuration
export const LINEAR_CONNECTION_PREFERENCES = 'linear_connection_preferences';

// For storing the Jira connection configuration
export const JIRA_CONNECTION_PREFERENCES = 'jira_connection_preferences';

// For storing the list that cards/tasks should be made in Trello
export const TRELLO_CONNECTED_LIST = 'trello_list';

// For storing the Asana connection configuration
export const ASANA_CONNECTION_PREFERENCES = 'asana_connection_preferences';

// For storing the Monday connection configuration
export const MONDAY_CONNECTION_PREFERENCES = 'monday_connection_preferences';

// The user's preferred task type when creating a new task in the composer
// (cord, jira, asana, etc)
export const DEFAULT_TASK_TYPE = 'default_task_type';

export const NOTIFICATION_CHANNELS = 'notification_channels';

// If user in embed partner has seen initial welcome message in expanded sidebar
export const INTEGRATION_WELCOME_NUX_SEEN = 'integration_welcome_nux_seen';

// For first sock puppet who has not updated their name and profile
// picture yet. Also shown if default avatar used.
export const INTEGRATION_COMPLETE_PROFILE_NUX_SEEN =
  'integration_complete_profile_nux_seen';

// Track initial page visits to determine which NUX to show
export const INTEGRATION_PAGE_VISIT_COUNT = 'integration_page_visit_count';

// For embed orgs who have not connected to slack
export const INTEGRATION_CONNECT_SLACK_NUX_SEEN =
  'integration_connect_slack_nux_seen';

// For embed users who are now connected to a slack org
export const INTEGRATION_SLACK_IS_CONNECTED_NUX_SEEN =
  'integraton_slack_is_connected_nux_seen';

// One-time override that makes sure that "Slack is Connected" NUX announcement
// is shown next.
export const INTEGRATION_SLACK_IS_CONNECTED_NUX_WAS_FORCED =
  'integration_slack_is_connected_nux_was_forced ';

// For embed users who have not linked to a slack profile but their org is
// linked to slack already
export const INTEGRATION_LINK_SLACK_PROFILE_NUX_SEEN =
  'integration_link_slack_profile_nux_seen';

// For Cord2.0 Nux
export const CONVERSATION_NUX_DISMISSED = 'conversation_nux_dismissed';
export const INBOX_NUX_DISMISSED = 'inbox_nux_dismissed';
export const LAUNCHER_NUX_DISMISSED = 'launcher_nux_dismissed';

export const DISABLE_HOTSPOT_ANNOTATIONS = 'disable_hotspot_annotations';

export const INBOX_READ_SECTION_CLOSED = 'inbox_read_section_closed';

export const ACTIVATION_FIRST_MESSAGE_SENT = 'activation_first_message_sent';

export const USER_PREFERENCE_KEY_LENGTH_LIMIT = 1000;
