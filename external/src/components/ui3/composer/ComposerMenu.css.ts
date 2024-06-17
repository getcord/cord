import { globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import {
  composerButtonsContainer,
  editorContainer,
  primaryButtonsGroup,
  secondaryButtonsGroup,
  expanded,
  medium,
  large,
  composerContainer,
} from 'external/src/components/ui3/composer/Composer.classnames.ts';

globalStyle(`.${composerButtonsContainer}`, {
  display: 'flex',
  justifyContent: 'space-between',
  padding: `0 ${cssVar('space-2xs')}`,
});

globalStyle(
  `:where(.${medium}, .${large}):where(.${expanded}) .${composerButtonsContainer}`,
  {
    borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
    padding: `${cssVar('space-2xs')} ${cssVar('space-2xs')} ${cssVar(
      'space-none',
    )}`,
  },
);

globalStyle(
  `:is(.${composerButtonsContainer}, .${editorContainer}) :where(.${primaryButtonsGroup}, .${secondaryButtonsGroup})`,
  {
    display: 'flex',
    gap: cssVar('space-3xs'),
    alignItems: 'center',
  },
);

globalStyle(
  `:where(.${composerContainer}:not(.${expanded})) .${secondaryButtonsGroup}`,
  {
    display: 'none',
  },
);
