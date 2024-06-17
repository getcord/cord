import { globalStyle } from '../../common/ui/style.js';
import { cssVar } from '../../common/ui/cssVariables.js';
import { fileContainer } from '../../components/FileAttachment.classnames.js';

import * as classes from '../../components/helpers/Link.classnames.js';
export default classes;
const { anchor, ellipsis, noUnderline } = classes;

globalStyle(`.${anchor}`, {
  textDecoration: 'none',
  color: cssVar('color-content-primary'),
  cursor: 'pointer',
});
globalStyle(`:where(.${anchor}):is(:hover, :active)`, {
  textDecoration: 'underline',
});
globalStyle(`:where(.${anchor}):visited`, {
  textDecoration: 'none',
});

globalStyle(`:where(.${anchor}.${noUnderline}):is(:hover, :active)`, {
  textDecoration: 'none',
});

globalStyle(`:where(.${anchor}.${ellipsis}):is(:hover, :active)`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`:where(.${fileContainer}:not(:hover)) .${anchor}`, {
  display: 'none',
});
