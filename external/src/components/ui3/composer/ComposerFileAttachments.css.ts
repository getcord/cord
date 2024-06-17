import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import {
  attachmentsContainer,
  composerContainer,
} from 'external/src/components/ui3/composer/Composer.classnames.ts';

export default { attachmentsContainer };

globalStyle(`:where(.${composerContainer}) .${attachmentsContainer}`, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: cssVar('space-2xs'),
  marginInline: cssVar('space-2xs'),
  alignItems: 'start',
});
