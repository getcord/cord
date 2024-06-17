import type { LinkCardData } from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

export const restAPICardList: LinkCardData[] = [
  {
    name: 'Authentication',
    linkTo: '/rest-apis/authentication',
    description: 'Authenticating to the REST API',
  },
  {
    name: 'Threads',
    linkTo: '/rest-apis/threads',
    description: 'List and edit threads',
  },
  {
    name: 'Messages',
    linkTo: '/rest-apis/messages',
    description: 'List and edit messages',
  },
  {
    name: 'Users',
    linkTo: '/rest-apis/users',
    description: 'Create and update users',
  },
  {
    name: 'Groups',
    linkTo: '/rest-apis/groups',
    description: 'Create and update groups',
  },
  {
    name: 'Batch',
    linkTo: '/rest-apis/batch',
    description: 'Update users and groups in batches',
  },
  {
    name: 'Notifications',
    linkTo: '/rest-apis/notifications',
    description: 'Send and manipulate notifications',
  },
  {
    name: 'Files',
    linkTo: '/rest-apis/files',
    description: 'Manage files',
  },
  {
    name: 'Preferences',
    linkTo: '/rest-apis/preferences',
    description: 'List and manipulate preferences',
  },
  {
    name: 'Errors',
    linkTo: '/rest-apis/errors',
    description: 'Errors the API can return',
  },
  {
    name: 'Projects',
    linkTo: '/rest-apis/projects',
    description: 'Manipulate projects',
  },
  {
    name: 'Presence',
    linkTo: '/rest-apis/presence',
    description: 'Update user presence',
  },
];
