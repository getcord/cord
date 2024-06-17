import {
  globalStyle,
  defaultGlobalStyle,
  CORD_V2,
} from '../common/ui/style.js';
import { cssVar } from '../common/ui/cssVariables.js';
import * as classes from './Facepile.classnames.js';
import { typing } from './Thread.classnames.js';
import { emptyStatePlaceholderContainer } from './helpers/EmptyStateWithFacepile.classnames.js';
export default classes;

const { facepileContainer, otherUsers } = classes;

/**
 * Base styles
 */
defaultGlobalStyle(`:where(.${CORD_V2}).${facepileContainer}`, {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  isolation: 'isolate',
  position: 'relative',
});

globalStyle(`.${otherUsers}`, {
  alignItems: 'center',
  alignSelf: 'stretch',
  color: cssVar('color-content-primary'),
  cursor: 'default',
  display: 'flex',
  paddingLeft: cssVar('facepile-avatar-border-width'),
});
globalStyle(`:where(.${otherUsers}):hover`, {
  color: cssVar('color-content-emphasis'),
});

/**
 * Facepile styles when used in other components
 */
globalStyle(
  `:where(.${emptyStatePlaceholderContainer}) .${facepileContainer}`,
  {
    marginBottom: cssVar('space-m'),
  },
);

globalStyle(`:where(.${typing}) .${facepileContainer}`, {
  minWidth: '20px',
});
