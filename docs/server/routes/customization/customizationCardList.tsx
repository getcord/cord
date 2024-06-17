/** @jsxImportSource @emotion/react */

import { showBeta } from 'docs/lib/showBeta.ts';
import type { LinkCardData } from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

export const customizationUICardList: LinkCardData[] = [
  {
    name: 'Cord components with CSS',
    linkTo: '/customization/css',
    description: "How to customize the appearance of Cord's components",
  },
  {
    name: 'UI text',
    linkTo: '/customization/translations',
    description: 'Change the language used in Cord components',
  },
  {
    name: 'Conversation titles',
    linkTo: '/customization/add-custom-page-title',
    description: 'Cord-specific page titles',
  },
  {
    name: 'Styling ThreadedComments Component',
    linkTo: '/customization/threaded-comments-examples',
    description:
      'See different ways of changing the appearance of Threaded Comments',
  },
  {
    name: 'Customizing React components',
    linkTo: '/customization/custom-react-components',
    description: 'Use your own components for further customization',
    beta: true,
    hidden: !showBeta(),
  },
];

export const customizationFeaturesCardList: LinkCardData[] = [
  {
    name: 'Emails',
    linkTo: '/customization/emails',
    description: 'Configuring where emails come from, and how they look',
  },
  {
    name: 'Set a custom redirect link',
    linkTo: '/customization/redirect-link',
    description: (
      <>
        What happens when someone is <strong>@mentioned</strong> at Cord, but
        hasn't logged into your app yet?
      </>
    ),
  },
  {
    name: 'Set up a custom S3 bucket',
    linkTo: '/customization/s3-bucket',
    description:
      'Upload Cord annotation screenshots to a storage bucket you have full control over',
  },
  {
    name: 'Log events to Segment',
    linkTo: '/customization/segment-event-logging',
    description: 'Receive full Cord analytics directly',
  },
];
