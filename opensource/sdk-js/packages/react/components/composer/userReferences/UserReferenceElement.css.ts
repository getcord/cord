import { globalStyle } from '../../../common/ui/style.js';
import { cssVar } from '../../../common/ui/cssVariables.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import * as classes from './UserReferenceElement.classnames.js';
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
