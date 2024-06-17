import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import * as classes from 'external/src/components/ui3/Link.classnames.ts';
export default classes;
const { anchor, ellipsis, noUnderline } = classes;
import { fileContainer } from '@cord-sdk/react/components/FileAttachment.classnames.ts';

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
