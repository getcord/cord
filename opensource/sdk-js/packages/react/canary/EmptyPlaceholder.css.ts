import { globalStyle } from '../common/ui/style.js';
import { cssVar } from '../common/ui/cssVariables.js';
import {
  emptyPlaceholderContainer,
  emptyPlaceholderTitle,
  emptyPlaceholderBody,
} from './EmptyPlaceholder.classnames.js';
export * from './EmptyPlaceholder.classnames.js';

globalStyle(`.${emptyPlaceholderContainer}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  lineHeight: cssVar('line-height-body'),
  margin: 'auto 0',
  overflow: 'auto',
  padding: cssVar('space-xs'),
  paddingBottom: cssVar('space-m'),
});

globalStyle(`.${emptyPlaceholderContainer} :where(.${emptyPlaceholderTitle})`, {
  color: cssVar('color-content-emphasis'),
  margin: `${cssVar('space-m')} 0 ${cssVar('space-2xs')} 0`,
  fontWeight: cssVar('font-weight-bold'),
});

globalStyle(`.${emptyPlaceholderContainer} :where(.${emptyPlaceholderBody})`, {
  color: cssVar('color-content-primary'),
  fontWeight: cssVar('font-weight-regular'),
});
