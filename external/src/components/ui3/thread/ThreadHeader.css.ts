import { cssVar } from 'common/ui/cssVariables.ts';

import { globalStyle } from 'common/ui/style.ts';
import { threadHeader } from '@cord-sdk/react/components/Thread.classnames.ts';
export { threadHeader };

globalStyle(`.${threadHeader}`, {
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  gap: cssVar('space-3xs'),
  justifyContent: 'flex-end',
  padding: cssVar('space-2xs'),
});
