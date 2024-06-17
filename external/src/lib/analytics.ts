import type { UUID, Announcement } from 'common/types/index.ts';
import type { ThirdPartyConnectionType } from 'external/src/graphql/operations.ts';

type EventPayloadData = {
  // Mount
  'app-mounted': never; // Workspace
  'error-fallback': never;
  'hacks-panel-mounted': never;
  'render-embedded-launcher': {
    withPresence: boolean;
    withIcon: boolean;
    label: string;
    badgeStyle: 'badged' | 'badged_with_count';
  };
  'render-sidebar-open': never;
  'show-app-login': never;
  'show-sidebar-login': never;
  'sidebar-app-mounted': { sidebarVisible: boolean };
  'slack-login-pop-up-launched': never;
  'toggle-sidebar-visibility': { to: boolean };

  // Navigation
  'change-inbox-tab': { tab: 'inbox' | 'activity' };
  'close-inbox': never;
  'close-settings-page': never;
  'close-settings-page-and-inbox': never;
  'deeplink-visit': {
    threadID: UUID;
    messageID?: UUID | null;
    deeplinkType: 'server-based' | 'query-params';
  };
  'expand-inbox-thread': { unread: boolean };
  'navigate-to': { location: string };
  'navigate-to-thread': {
    from: 'inbox' | 'activity' | 'extensionPopupInbox';
    unread: boolean;
  };
  'open-inbox': never;
  'open-settings': never;
  'open-thread-in-full-page': { resolved: boolean };

  // Thread menu
  'click-share-thread-to-email-submit-button': {
    threadID: string;
    email: string;
  };
  'click-thread-menu-connect-slack-prompt': never;
  'click-thread-menu-move-to-read': never;
  'click-thread-menu-reopen-thread': never; // Cord1 only
  'click-thread-menu-resolve-thread': never;
  'click-thread-menu-share-to-email': never;
  'click-thread-menu-share-to-slack': never;
  'click-thread-menu-shared-to-slack-link': never;
  'click-thread-menu-subscribed': { subscribed: boolean };
  'click-thread-options-collapse-thread': never;
  'click-message-options-menu': { thread: boolean; message: boolean };
  'thread-resolved': { threadID: UUID; location?: string };
  'thread-unresolved': { threadID: UUID; location?: string };

  // Thread header
  'click-thread-header-resolve-thread': never;
  'click-thread-header-close-thread': never;

  // Share thread
  'click-draft-thread-remove-share-to-slack-selection': never;
  'click-draft-thread-share-to-slack': never;
  'thread-shared-to-slack': {
    threadID: UUID;
    newThread: boolean;
  };
  'thread-shared-to-email': {
    success: boolean;
    threadID: UUID;
    email: string;
  };

  // Close thread with draft warning if applicable
  'thread-closed': {
    hadDraft: boolean;
    keptDraft?: boolean;
  };

  // Settings
  'click-connect-slack-settings': never;
  'toggle-hotspot-annotations-setting': { to: boolean };
  'toggle-notification-setting': { to: boolean; type: string };

  // Mentions/assignees
  'clear-assignee-selection': never;
  'clear-mention-selection': never;
  'insert-assignee': { userID: UUID };
  'insert-mention': { userID: UUID };
  'navigate-assignee-list-options': never;
  'navigate-mention-list-options': never;

  // Reactions
  'reaction-added': { emoji: string };
  'reaction-removed': { emoji: string };

  // Message send / update
  'create-task': {
    method: 'composer-text';
    num_todos: number;
    assignees: UUID[];
    provider: string;
  };
  'message-delete-undone': never;
  'message-deleted': never;
  'message-send-ui': {
    annotations: number;
    textAnnotations: number;
    customAnnotations: number;
    attachments: number;
    mentions: number;
    newThread: boolean;
    threadID: UUID;
  };
  'message-send-failed': never;
  'message-send-succeeded': never;
  'message-updated': never;
  'remove-task': { method: 'task-menu' };
  'update-task': {
    method?: string;
    task_done?: boolean;
    num_todos?: number;
    to_do_id?: UUID;
    todo_done?: boolean;
    assignees?: UUID[];
  };

  // Composer menu
  'click-mention-button-composer': never;
  'click-thread-composer-connect-slack-prompt': never; // Cord 1 only
  'click-thread-composer-share-to-slack': never; // Cord 1 only

  // Slash menu
  'composer-slash-menu-annotation': never;
  'composer-slash-menu-attachment': never;
  'composer-slash-menu-task': never;
  'composer-slash-menu-todo': never;

  // Annotations
  'add-hotspot-annotation': never;
  'click-annotation': {
    customAnnotation: boolean;
  };
  'click-hotspot-annotation': never;
  'create-text-annotation': {
    targetNodeName: string;
    insideIframe: boolean;
    textLength: number;
  };
  'hide-annotation': never;
  'hide-hotspot-annotation': never;
  'hotspot-annotations-on-page': { total: number };
  'hover-hotspot-annotation': { target: 'hide-button' | 'annotation-pointer' };
  'remove-hotspot-annotation': never;
  'show-annotation': never;

  'click-selection-comments-button': {
    targetNodeName: string;
    customAnnotation: boolean;
    textLength: number;
  };
  'show-selection-comments-button':
    | {
        textLength: number;
        startContainer: string;
        endContainer: string;
      }
    | undefined;

  // NUX boxes
  'show-conversation-nux-message': never;
  'show-inbox-nux-message': never;
  'show-launcher-nux-message': never;
  'dismiss-conversation-nux-message': never;
  'dismiss-inbox-nux-message': never;
  'dismiss-launcher-nux-message': never;
  'show-activation-nux-message': never;

  // Integration NUX (todo)
  'click-integration-nux-connect-slack': never;
  'click-integration-nux-link': {
    link: string;
    nuxType: Announcement;
  };
  'click-integration-nux-link-slack-profile': never;
  'click-integration-nux-link-slack-profile-email-match': never;
  'click-integration-nux-link-slack-profile-email-match-not-you': never;
  'dismiss-complete-profile-nux': never;
  'dismiss-initial-nux': never;
  'dismiss-integration-nux-connect-slack': never;
  'dismiss-integration-nux-link-slack-profile': never;
  'dismiss-slack-is-connected-nux': never;
  'dismiss-welcome-nux': { method: 'get-started-button' | 'close-button' };
  'seen-integration-nux-box': {
    nuxType: Announcement;
    visitCount: number;
  };
  'show-initial-nux': never;
  'slack-is-connected-nux-face-clicked': never;

  // Update name and profile picture
  'invalid-user-input-for-profile-picture': { size: number; mimeType: string };
  'update-profile': never;

  // Waitlist
  'wait-list-logout': never;
  'wait-list-support-email-clicked': never;
  'wait-list-typeform-link-clicked': never;
  'wait-list-ui-mounted': never;

  // Connecting third party services
  'click-mention-list-connect-slack': never;
  'click-settings-cancel-final-step-disconnect-slack': never;
  'click-settings-final-step-disconnect-slack': never;
  'click-settings-first-step-disconnect-slack': never;
  'connect-service-failed': {
    service: 'slack' | ThirdPartyConnectionType;
    connectionType?: 'support';
    reason: 'error' | 'cancelled';
  };
  'connect-service-started': {
    service: 'slack' | ThirdPartyConnectionType;
    connectionType?: 'support';
  };
  'connect-service-successful': {
    service: 'slack' | ThirdPartyConnectionType;
    connectionType?: 'support';
  };
  'disconnect-service': {
    service: 'slack' | ThirdPartyConnectionType;
  };

  // Auth
  'logged-out-pp-link-clicked': never;
  'logged-out-support-for-google-login-clicked': never;
  'logged-out-support-for-microsoft-teams-login-clicked': never;
  'logged-out-tos-link-clicked': never;
  'slack-login-launched': never;
  logout: never;

  // Extension popup
  'click-disable-cord-on-domain-extension-popup': never;
  'snooze-cord': { for: string };
  'unsnooze-cord': never;

  // Dev console
  'dev-console-click-billing': {
    name: string | undefined;
    email: string | undefined;
  };
  'dev-console-click-billing-history': {
    name: string | undefined;
    email: string | undefined;
  };
  'dev-console-click-service-agreement': {
    name: string | undefined;
    email: string | undefined;
  };
  'unlink-slack-org-for-support-chat': {
    appID: UUID;
  };
  'console-single-existing-customer-page-load': {
    email: string | undefined;
    customerID: string;
  };
  'console-multiple-existing-customers-page-load': {
    email: string | undefined;
  };
  'console-user-pending-request-page-load': {
    pendingCustomerID: string;
    email: string | undefined;
  };
  'console-create-new-customer-button-click': {
    email: string | undefined;
    pageType:
      | 'single-existing-customer'
      | 'multiple-existing-customers'
      | 'pending-request'
      | undefined;
  };
  'console-customer-request-access-existing-customer': {
    email: string | undefined;
    customerID: string;
  };

  // Misc
  'composer-became-inactive-blur': never;
  'drag-floating-launcher': never;
  'hover-for-presence': never;
  'logged-out-support-email-clicked': never;
  'native-screenshot-taken': {
    total: number;
    parallelImagesFontsAndClone: number;
    clone: number;
    images: number;
    fonts: number;
    embedImages: number;
    totalCloneToSvg: number;
    totalAfterAnnotationPlaced: number;
    totalSvgToImage: number;
  };
  'screenshot-target': { targetsTags: string[] };

  // SDK
  'sdk-components-used': {
    components: string[];
  };
  'sdk-options-used': {
    options: string[];
  };
  'sdk-client-info': {
    browserName: string | null;
    browserVersion: string | null;
    deviceModel: string | null;
    deviceVendor: string | null;
    deviceType: string | null;
    osName: string | null;
    osVersion: string | null;
  };
  'sdk-inbox-launcher-clicked': never;
  'sdk-inbox-launcher-modal-opened': never;
  'sdk-js-api-call': {
    module: string;
    operation: string;
  };
  'sdk-startup-performance': {
    initToRenderMs: number;
    renderToComponentsMs: number;
    initialComponentRenderMs: number;
  };

  // This one is used in hoc withGroupIDCheck though
  'sdk-group-id-error': {
    propGroupID: string | undefined;
    groupID: string | undefined;
    componentName: string;
  };

  // Notifications
  'notification-onclick': {
    id: UUID;
  };
  'notification-list-mark-all-as-read-onclick': never;
  'notification-list-render': {
    count: number;
  };
  'notification-list-launcher-clicked': never;

  // V2 components
  'opensource-component-usage': {
    components: string[];
    version: string;
  };
  'opensource-component-replacement': {
    components: string[];
    version: string;
  };
};

export type EventName = keyof EventPayloadData;
export type EventPayload<E extends EventName> = EventPayloadData[E];

export type LogEventFn = <E extends EventName>(
  eventName: E,
  ...args: EventPayload<E> extends never ? [] : [EventPayload<E>]
) => void;
