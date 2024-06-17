import { globalStyle } from 'common/ui/style.ts';

import { loadOlderMessages } from '@cord-sdk/react/components/Thread.classnames.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export * from '@cord-sdk/react/components/Thread.classnames.ts';

globalStyle(`.${loadOlderMessages}`, {
  display: 'flex',
  gap: `${cssVar('space-2xs')}`,
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  paddingInlineStart: `calc(2 * ${cssVar('space-2xs')} + 20px)`,
});
