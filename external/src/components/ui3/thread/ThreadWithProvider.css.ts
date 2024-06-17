import { globalStyle } from 'common/ui/style.ts';

import { container } from '@cord-sdk/react/components/Thread.classnames.ts';
export * from '@cord-sdk/react/components/Thread.classnames.ts';

globalStyle(`.${container}`, {
  height: '100%',
  maxHeight: 'inherit',
});
