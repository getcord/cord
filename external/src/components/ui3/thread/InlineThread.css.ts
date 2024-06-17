import { globalStyle } from 'common/ui/style.ts';
import { inlineThread } from '@cord-sdk/react/components/Thread.classnames.ts';
export { inlineThread };

globalStyle(`.${inlineThread}`, {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: 'inherit',
  // add "overflow: auto" to topmost box so that nested boxes dont cut
  // through its rounded corners
  overflow: 'auto',
});
