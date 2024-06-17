import * as classes from 'external/src/components/ui3/composer/UserReferenceElement.classnames.js';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export const { userDisplayName, userReferenceElement } = classes;

globalStyle(`.${userReferenceElement}`, {
  color: cssVar('color-content-emphasis'),
  cursor: 'pointer',
  fontWeight: cssVar('font-weight-bold'),
  textDecoration: 'none',
});

globalStyle(
  `:where(.${userReferenceElement}.${MODIFIERS.highlighted}) .${userDisplayName}`,
  {
    textDecoration: 'underline',
  },
);
