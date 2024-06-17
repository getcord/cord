import { globalStyle } from '../../common/ui/style.js';

import { cssVar } from '../../common/ui/cssVariables.js';
import {
  composerContainer,
  attachmentsContainer,
} from '../Composer.classnames.js';

export default { attachmentsContainer };

globalStyle(`:where(.${composerContainer}) .${attachmentsContainer}`, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: cssVar('space-2xs'),
  marginInline: cssVar('space-2xs'),
  alignItems: 'start',
});
