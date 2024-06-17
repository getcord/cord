import { globalStyle } from '../common/ui/style.js';

import { addSpaceVars, cssVar } from '../common/ui/cssVariables.js';
import { getModifiedSelector } from '../common/ui/modifiers.js';
import {
  base,
  label,
  listItemContainer,
  subtitle,
  textOnly,
} from './MenuItem.classnames.js';

export { base, label, listItemContainer, subtitle, textOnly };

globalStyle(`.${base}`, {
  alignItems: 'center',
  backgroundColor: 'transparent',
  borderStyle: 'none',
  borderRadius: cssVar('border-radius-medium'),
  color: cssVar('color-content-emphasis'),
  cursor: 'pointer',
  display: 'flex',
  textAlign: 'center',
  width: '100%',
});

globalStyle(`.${base}:where(:not(:disabled):active)`, {
  backgroundColor: cssVar('color-base-x-strong'),
});
globalStyle(`.${base}:where(:not(:disabled):not(:active):hover)`, {
  backgroundColor: cssVar('color-base-strong'),
});

globalStyle(`.${base} svg`, {
  // make sure that the icon does not change its size
  flexShrink: 0,
});

globalStyle(`.${base}:disabled`, {
  color: cssVar('color-content-secondary'),
  cursor: 'unset',
});

globalStyle(`.${listItemContainer}`, {
  listStyle: 'none',
});

globalStyle(`:where(.${base}).${textOnly}`, {
  padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
});

globalStyle(`:where(.${base}):not(.${textOnly})`, {
  gap: cssVar('space-2xs'),
  padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
});

globalStyle(`:where(.${base}) .${subtitle}`, {
  marginLeft: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: cssVar('color-content-secondary'),
});

globalStyle(`:where(.${base}) .${label}`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: cssVar('color-content-emphasis'),
});

globalStyle(getModifiedSelector('selected', `.${base}`), {
  backgroundColor: cssVar('color-base-strong'),
});
