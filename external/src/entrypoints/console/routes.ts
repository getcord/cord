export const ConsoleRoutes = {
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT: '/projects/:id',
  LOGIN: '/login',
  APPLICATION_ORG: ':orgID',
  ISSUES: '/issues',
  ISSUE: '/issues/:id',
  SIGNUP: '/signup',
  SETTINGS: '/settings',
} as const;

export const ConsoleApplicationRoutes = {
  APPLICATION_GETTING_STARTED: 'getting-started',
  APPLICATION_MESSAGES: 'messages',
  APPLICATION_SETTINGS: 'settings',
  APPLICATION_THREADS: 'threads',
  APPLICATION_THREAD_MESSAGES: 'threads/:threadID',
  APPLICATION_USERS: 'users',
  APPLICATION_ORGS: 'groups',
  APPLICATION_DEPRECATED_ORGS: 'orgs',
  APPLICATION_ORG_USERS: 'groups/:orgID',
  APPLICATION_DEPRECATED_ORG_USERS: 'orgs/:orgID',
};

export const ConsoleApplicationSettingsRoutes = {
  APPLICATION_ADVANCED: 'advanced',
  APPLICATION_COLORS: 'colors',
  APPLICATION_EVENTS: 'events',
  APPLICATION_EMAIL_NOTIFICATIONS: 'email-notifications',
  APPLICATION_GENERAL: 'general',
  APPLICATION_NEW_USER_EXPERIENCE: 'new-user-experience',
  APPLICATION_REDIRECT_URIS: 'redirect-uris',
  APPLICATION_SUPPORT_CHAT: 'support-chat',
  APPLICATION_USERS: 'users',
  APPLICATION_THREADS: 'threads',
};

export const ConsoleSettingsRoutes = {
  SETTINGS_USER: 'user',
  SETTINGS_CUSTOMER: 'customer',
  SETTINGS_BILLING: 'billing',
  SETTINGS_SEATS: 'seats',
};

export function getBaseApplicationURL(id: string): string {
  return `${ConsoleRoutes.PROJECT.replace(':id', id)}`;
}

export function getBaseSettingsURL(id: string): string {
  return `${getBaseApplicationURL(id)}/${
    ConsoleApplicationRoutes.APPLICATION_SETTINGS
  }`;
}
export function getBaseGettingStartedURL(id: string): string {
  return `${getBaseApplicationURL(id)}/${
    ConsoleApplicationRoutes.APPLICATION_GETTING_STARTED
  }`;
}
export function projectRedirect(): string {
  return `${window.location.pathname?.replace('application', 'project')}`;
}
