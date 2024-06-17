import type { LinkCardData } from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

export const referenceCardList: LinkCardData[] = [
  {
    name: 'Authentication',
    linkTo: '/reference/authentication',
    description: 'Details about auth tokens',
  },
  {
    name: 'Server Libraries',
    linkTo: '/reference/server-libraries',
    description: 'Simplifying development and authentication',
  },
  {
    name: 'Permissions',
    linkTo: '/reference/permissions',
    description: 'Configuring who can see what',
  },
  {
    name: 'Events Webhook',
    linkTo: '/reference/events-webhook',
    description: 'Get notified when things happen in your app',
  },
  {
    name: 'Identifiers',
    linkTo: '/reference/identifiers',
    description: 'What is a valid ID',
  },
  {
    name: 'Location',
    linkTo: '/reference/location',
    description: "Specifying points of interest in your app's UI",
  },
  {
    name: 'Browser Support',
    linkTo: '/reference/browser-support',
    description: 'Which browsers and versions are supported',
  },
  {
    name: 'Content Security Policy',
    linkTo: '/reference/csp-settings',
    description: 'The full list of CSP to whitelist for Cord',
  },
  {
    name: 'Email notifications',
    linkTo: '/reference/email-notifications',
    description: 'Learn more about emails sent by Cord',
  },
  {
    name: 'Cord CLI tool',
    linkTo: '/reference/cord-cli',
    description: 'Cord CLI installation guide',
  },
  {
    name: 'Changelog',
    linkTo: '/reference/changelog',
    description: "Notable changes to Cord's SDK",
  },
];
