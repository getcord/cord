import { globalStyle } from '@vanilla-extract/css';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import { threads } from '../threads/Threads.classnames.js';

export const container = cordifyClassname('resolved-thread-composer');

globalStyle(`.${container}`, {
  alignItems: 'center',
  border: cssVar('composer-border'),
  borderRadius: cssVar('composer-border-radius'),
  display: 'flex',
  backgroundColor: cssVar('color-base-strong'),
  padding: cssVar('space-2xs'),
  margin: cssVar('space-2xs'),
});

export const resolvedComposerText = cordifyClassname(
  'resolved-thread-composer-text',
);
globalStyle(`.${container} :where(.${resolvedComposerText})`, {
  flexGrow: 1,
  color: cssVar('color-content-primary'),
});
globalStyle(`.${threads} .${container}`, {
  flex: 1,
});
