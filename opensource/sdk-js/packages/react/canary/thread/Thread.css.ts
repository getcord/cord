import { cssVar } from '../../common/ui/cssVariables.js';
import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../../common/ui/style.js';
import * as classes from '../../components/Thread.classnames.js';
export default classes;

const { threadHeader, thread } = classes;

defaultGlobalStyle(`:where(.${CORD_V2}).${thread}`, {
  backgroundColor: cssVar('color-base'),
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: '250px',
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('border-radius-medium'),
  position: 'relative',
});

globalStyle(`.${threadHeader}`, {
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  gap: cssVar('space-3xs'),
  justifyContent: 'flex-end',
  padding: cssVar('space-2xs'),
});
