/** @jsxImportSource @emotion/react */

import type { LinkCardData } from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

export const howToCardList: LinkCardData[] = [
  {
    name: 'Create Cord messages',
    linkTo: '/how-to/create-cord-messages',
    description:
      'How to create Cord messages with rich text formatting, links, and more',
  },
  {
    name: 'Improve annotation accuracy',
    linkTo: '/how-to/improve-annotation-accuracy',
    description: 'Make sure your annotations are pointing to the correct place',
  },
  {
    name: 'Build charts and tables with comments',
    linkTo: '/how-to/dashboard-guide',
    description: 'Create an integrated dashboard commenting experience',
  },
  {
    name: 'Support iframes in annotations',
    linkTo: '/how-to/support-iframes-in-annotation-screenshots',
    description:
      "Configure your page to ensure screenshots don't miss anything",
  },
];
