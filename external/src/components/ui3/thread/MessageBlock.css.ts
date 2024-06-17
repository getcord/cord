import { globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';

import { messageBlock } from '@cord-sdk/react/components/Thread.classnames.ts';
export * from '@cord-sdk/react/components/Thread.classnames.ts';

globalStyle(`.${messageBlock}`, {
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  flexDirection: 'column',
});
