import { cssVar } from '../../../common/ui/cssVariables.js';
import { globalStyle } from '../../../common/ui/style.js';
import { fileContainer } from '../../../components/FileAttachment.classnames.js';
import { loadOlderMessages } from '../../../components/Thread.classnames.js';
import * as classes from '../../../components/helpers/ButtonWithUnderline.classnames.js';
export default classes;

const { buttonText, buttonWithUnderline } = classes;

globalStyle(`.${buttonWithUnderline}`, {
  alignItems: 'center',
  backgroundColor: 'unset',
  color: cssVar('color-content-emphasis'),
  cursor: 'pointer',
  display: 'inline-flex',
  gap: cssVar('space-4xs'),
  width: 'fit-content',
});

globalStyle(`.${buttonWithUnderline}:disabled`, {
  cursor: 'unset',
});

globalStyle(`:where(.${buttonWithUnderline}) .${buttonText}`, {
  overflow: 'hidden',
  textDecoration: 'none',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
globalStyle(
  `:where(.${buttonWithUnderline}:is(:hover, :active)) .${buttonText}`,
  {
    textDecoration: 'underline',
  },
);

globalStyle(
  `:where(.${buttonWithUnderline}:is(:visited, :disabled)) .${buttonText}`,
  {
    textDecoration: 'none',
  },
);

globalStyle(`:where(.${loadOlderMessages}) .${buttonWithUnderline}`, {
  color: cssVar('color-content-primary'),
});

globalStyle(`:where(.${fileContainer}:not(:hover)) .${buttonWithUnderline}`, {
  display: 'none',
});
