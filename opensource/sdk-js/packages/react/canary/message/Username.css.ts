import { cssVar } from '../../common/ui/cssVariables.js';
import { globalStyle } from '../../common/ui/style.js';
import { authorName } from '../../components/Message.classnames.js';

globalStyle(`.${authorName}`, {
  alignSelf: 'baseline',
  color: cssVar('color-content-emphasis'),
  gridArea: 'authorName',
  marginTop: cssVar('space-3xs'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
