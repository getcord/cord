import { cssVar } from '../../common/ui/cssVariables.js';
import { globalStyle } from '../../common/ui/style.js';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import * as composerClasses from '../../components/Composer.classnames.js';

const { editorContainer, primaryButtonsGroup, secondaryButtonsGroup } =
  composerClasses;

export const composerToolbar = cordifyClassname('composer-toolbar');

globalStyle(`.${composerToolbar}`, {
  display: 'flex',
  justifyContent: 'space-between',
  borderTop: `1px solid ${cssVar('color-base-x-strong')}`,
  padding: `${cssVar('space-2xs')} ${cssVar('space-2xs')} ${cssVar(
    'space-none',
  )}`,
});

globalStyle(
  `:is(.${composerToolbar}, .${editorContainer}) :where(.${primaryButtonsGroup}, .${secondaryButtonsGroup})`,
  {
    display: 'flex',
    gap: cssVar('space-3xs'),
    alignItems: 'center',
  },
);

globalStyle(
  `${composerClasses.collapsedComposerSelector} .${composerToolbar} .${secondaryButtonsGroup} button`,
  {
    display: 'none',
  },
);

globalStyle(
  `${composerClasses.collapsedComposerSelector} .${composerToolbar}`,
  {
    border: 'none',
    padding: 0,
    paddingInlineEnd: cssVar('space-2xs'),
  },
);
