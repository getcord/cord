import { globalStyle } from '@vanilla-extract/css';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import { inlineThread, threads } from './Threads.classnames.js';

export const tabbedThreads = cordifyClassname('tabbed-threads');
export const threadsTabsContainer = cordifyClassname('threads-tab-container');
export const threadsTab = cordifyClassname('threads-tab');
export const threadsActiveTab = cordifyClassname('active');

globalStyle(`.${tabbedThreads}`, {
  backgroundColor: cssVar('color-base'),
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space-2xs'),
  padding: cssVar('space-2xs'),
  position: 'relative',
});

globalStyle(`.${threadsTabsContainer}`, {
  backgroundColor: cssVar('color-base-strong'),
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  margin: cssVar('space-2xs'),
  padding: cssVar('space-3xs'),
});

globalStyle(`.${threadsTab}`, {
  border: 'none',
  borderRadius: cssVar('space-3xs'),
  cursor: 'pointer',
  flexBasis: 0,
  flexGrow: 1,
  padding: cssVar('space-3xs'),
});

globalStyle(`.${threadsTab}:hover`, {
  backgroundColor: cssVar('color-base-x-strong'),
});

globalStyle(`.${threadsTab}.${threadsActiveTab}`, {
  backgroundColor: cssVar('color-base'),
});

globalStyle(`.${threadsTab}.${threadsActiveTab}:hover`, {
  cursor: 'unset',
});

globalStyle(`.${tabbedThreads} .${threads}`, {
  border: 'none',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  overflow: 'auto',
  padding: 0,
});

globalStyle(`.${tabbedThreads} .${threads}:not(.${threadsActiveTab})`, {
  display: 'none',
});

globalStyle(`.${tabbedThreads} .${inlineThread}`, {
  border: 'none',
});
