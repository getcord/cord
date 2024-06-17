// ADD NEW FLAGS HERE ONLY IF YOU NEED THEM ON THE CLIENT-SIDE
// If the new flag is only used server-side then add your new flag in:
// server/src/featureflags/index.ts
// If you need to use them in BOTH the client AND the server, you only need
// to add them once, in this file.
//
// Ensure they're set up in LaunchDarkly before you add them here.  The key for
// the flag must match the key in LaunchDarkly.
//
// The full set of valid values for a flag should be in the second type argument
// to FeatureFlag, so if you have a three-state feature flag of "yes", "no", and
// "maybeso", you should declare it as:
//
// MULTI_STATE_FLAG: {
//   key: 'multi_state_flag',
//   defaultValue: 'no',
// } as FeatureFlag<'multi_state_flag', 'yes' | 'no' | 'maybeso'>
export const FeatureFlags = {
  USE_NEW_CSS_COMPONENTS: {
    key: 'Use_new_CSS_components',
    defaultValue: {},
  } as FeatureFlag<'Use_new_CSS_components', Record<string, object>>,
  SUPPORT_CHAT_ENABLED: {
    key: 'support_chat_enabled',
    defaultValue: false,
  } as FeatureFlag<'support_chat_enabled', boolean>,
  ENABLE_ANNOTATIONS_SCREENSHOTS: {
    key: 'enable_annotations_screenshots',
    defaultValue: false,
  } as FeatureFlag<'enable_annotations_screenshots', boolean>,
  ENABLE_PLAINTEXT_ANNOTATIONS: {
    key: 'enable_plaintext_annotations',
    defaultValue: false,
  } as FeatureFlag<'enable_plaintext_annotations', boolean>,
  ENABLE_ATTACHMENTS: {
    key: 'enable_attachments',
    defaultValue: false,
  } as FeatureFlag<'enable_attachments', boolean>,
  EMAIL_SHARING: {
    key: 'email_sharing',
    defaultValue: false,
  } as FeatureFlag<'email_sharing', boolean>,
  ENABLE_FORCE_REFRESH_PROVIDER: {
    key: 'enable_force_refresh_provider',
    defaultValue: false,
  } as FeatureFlag<'enable_force_refresh_provider', boolean>,
  MONDAY_TASKS: {
    key: 'monday_tasks',
    defaultValue: false,
  } as FeatureFlag<'monday_tasks', boolean>,
  TAKE_SCREENSHOT_WHEN_CREATING_THREAD: {
    key: 'take_screenshot_when_creating_thread',
    defaultValue: false,
  } as FeatureFlag<'take_screenshot_when_creating_thread', boolean>,
  TAKE_SCREENSHOT_WHEN_SENDING_MESSAGE: {
    key: 'take_screenshot_when_sending_message',
    defaultValue: false,
  } as FeatureFlag<'take_screenshot_when_sending_message', boolean>,
  OPEN_THREAD_SAME_PAGE: {
    key: 'open_thread_same_page',
    defaultValue: false,
  } as FeatureFlag<'open_thread_same_page', boolean>,
  SHOW_ACTIVATION_WELCOME_MESSAGE_NUX: {
    key: 'show_activation_welcome_message_nux',
    defaultValue: false,
  } as FeatureFlag<'show_activation_welcome_message_nux', boolean>,
  ENABLE_SLACK_FEATURES: {
    key: 'enable-slack-features',
    defaultValue: true,
  } as FeatureFlag<'enable-slack-features', boolean>,
  ENABLE_DEV_CONSOLE_SELF_SERVE: {
    key: 'enable-dev-console-self-serve',
    defaultValue: false,
  } as FeatureFlag<'enable-dev-console-self-serve', boolean>,
  // TODO: remove - no longer used
  THREAD_STYLING_TWEAKS: {
    key: 'thread_styling_tweaks',
    defaultValue: false,
  } as FeatureFlag<'thread_styling_tweaks', boolean>,
  REMOVE_TASKS_FEATURE: {
    key: 'remove_tasks_feature',
    defaultValue: false,
  } as FeatureFlag<'remove_tasks_feature', boolean>,
  SHOW_COMMUNITY_IN_CONSOLE: {
    key: 'show-community-in-console',
    defaultValue: false,
  } as FeatureFlag<'show-community-in-console', boolean>,
  SHOW_CUSTOMER_ISSUES_IN_CONSOLE: {
    key: 'show-customer-issues-in-console',
    defaultValue: false,
  } as FeatureFlag<'show-customer-issues-in-console', boolean>,
  TAKE_SCREENSHOT_OF_CANVAS_ONLY: {
    key: 'take_screenshot_of_canvas_only',
    defaultValue: false,
  } as FeatureFlag<'take_screenshot_of_canvas_only', boolean>,
  SHOW_EVENTS_TAB_IN_CONSOLE: {
    key: 'show_events_tab_in_console',
    defaultValue: false,
  } as FeatureFlag<'show_events_tab_in_console', boolean>,
  ENABLE_TEXT_ANNOTATIONS: {
    key: 'enable_text_annotations',
    defaultValue: false,
  } as FeatureFlag<'enable_text_annotations', boolean>,
  ENABLE_EMAIL_NOTIFICATIONS: {
    key: 'enable_email_notifications',
    defaultValue: true,
  } as FeatureFlag<'enable_email_notifications', boolean>,
  ENABLE_ANNOTATIONS_OVERLAY: {
    key: 'enable_annotations_overlay',
    defaultValue: true,
  } as FeatureFlag<'enable_annotations_overlay', boolean>,
  ENABLE_SENTRY: {
    key: 'enable_sentry',
    defaultValue: true,
  } as FeatureFlag<'enable_sentry', boolean>,
  CONSOLE_WEBINAR_BANNER: {
    key: 'console_webinar_banner',
    defaultValue: {},
  } as FeatureFlag<'console_webinar_banner', object>,
  ENABLE_VIDEO_CAPABILITIES: {
    key: 'enable_video_capabilities',
    defaultValue: false,
  } as FeatureFlag<'enable_video_capabilities', boolean>,
  SHOW_LINK_PREVIEWS: {
    key: 'show-link-previews',
    defaultValue: false,
  } as FeatureFlag<'show-link-previews', boolean>,
  BILLING_ENABLED_IN_CONSOLE: {
    key: 'billing_enabled_in_console',
    defaultValue: false,
  },
  MENTION_NOTIFICATION_EMAIL_TEMPLATE_ID: {
    key: 'mention_notification_email_template_id',
    defaultValue: 'd-6309e6ccb36a4a769957795f475c8130',
  } as FeatureFlag<
    'mention_notification_email_template_id',
    | 'd-6309e6ccb36a4a769957795f475c8130'
    | 'd-8f2246c657a8498394e9caf181816bc3'
    | 'd-8a8088e59eed4622b2d09078de372fe8'
    | 'd-bc3669c391774addb7da37f92a3f97e3'
  >,
  SHOW_CONSOLE_LANDING_PAGE: {
    key: 'show_console_landing_page',
    defaultValue: false,
  },
} as const;

// The generic type that makes this all work.  The first type parameter is
// always set to a single string, and it makes it possible to do type inference
// on the useFeatureFlag() call and figure out what the return value is.
export type FeatureFlag<K, T> = {
  key: K;
  defaultValue: T;
};

// The map of feature flag keys to the default value for that flag.  We have to
// use `as any` in the assignment because TypeScript will only infer that the
// return type is {[key: string]: union_of_all_flag_value_types} rather than
// associating the right type with the right key.
const defaults: {
  [P in keyof typeof FeatureFlags as (typeof FeatureFlags)[P]['key']]: (typeof FeatureFlags)[P]['defaultValue'];
} = Object.fromEntries(
  Object.entries(FeatureFlags).map(([_, v]) => [v.key, v.defaultValue]),
) as any;

/**
 * Returns an object that maps from feature flag keys to their default value.
 */
export function featureFlagDefaults() {
  return defaults;
}
