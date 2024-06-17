import { cssVar } from '../common/ui/cssVariables.js';
import { globalStyle } from '../common/ui/style.js';
import { cordifyClassname } from '../common/cordifyClassname.js';
import { thread } from '../components/Thread.classnames.js';
import { threads } from './threads/Threads.classnames.js';

export const scrollContainer = cordifyClassname('scroll-container');
globalStyle(`.${scrollContainer}`, {
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 1,
  overflow: 'auto',
  overscrollBehavior: 'contain',
  position: 'relative',
});

globalStyle(`.${thread} .${scrollContainer}, .${threads} .${scrollContainer}`, {
  gap: cssVar('space-2xs'),
  padding: cssVar('space-3xs'),
  paddingBottom: cssVar('space-2xs'),
  flex: 1,
});
