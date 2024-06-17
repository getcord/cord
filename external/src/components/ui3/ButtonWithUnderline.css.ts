import { globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import { loadOlderMessages } from '@cord-sdk/react/components/Thread.classnames.ts';
import { fileContainer } from 'external/src/components/ui3/composer/FileAttachment.css.ts';
import * as classes from 'external/src/components/ui3/ButtonWithUnderline.classnames.ts';
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
