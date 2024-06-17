import { globalStyle } from 'common/ui/style.ts';

import { editorStyles } from 'common/ui/editorStyles.ts';
import type { CSSVariable } from 'common/ui/cssVariables.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import { Sizes } from 'common/const/Sizes.ts';
import * as classes from 'external/src/components/ui3/composer/Composer.classnames.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

export default classes;

const {
  composerContainer,
  editorSlot,
  editor,
  placeholder,
  editorContainer,
  expanded,
  small,
  medium,
  large,
} = classes;
const COMPOSER_COUPLED_CSS_VARS: {
  height: CSSVariable;
  margin: CSSVariable;
} = {
  height: 'space-xl',
  margin: 'space-4xs',
};

globalStyle(`.${editorContainer}`, {
  background: 'none',
  cursor: 'text',
  flexGrow: '1',
  fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
  lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
  marginBottom: cssVar(COMPOSER_COUPLED_CSS_VARS.margin),
  marginTop: cssVar(COMPOSER_COUPLED_CSS_VARS.margin),
  maxHeight: cssVar('composer-height-max'),
  overflow: 'auto',
  marginInline: cssVar('space-2xs'),
  position: 'relative',
  outline: 'none',
  resize: 'none',
});

globalStyle(
  `:where(.${composerContainer}.${MODIFIERS.disabled}) .${editorContainer}`,
  {
    cursor: 'default',
  },
);

globalStyle(`.${medium}:where(.${editorContainer})`, {
  minHeight: `${cssVar('composer-height-min')}`,
});

globalStyle(
  `:where(.${composerContainer}.${expanded}:not(.${small})) .${editorContainer}`,
  {
    minHeight: cssVar('space-3xl'),
  },
);

globalStyle(
  `:where(.${composerContainer}.${expanded}.${large}) .${editorContainer}`,
  {
    minHeight: cssVar('composer-height-tall'),
  },
);

globalStyle(`:where(.${composerContainer}, .${editorSlot}) .${editor}`, {
  ...editorStyles,
  outline: 'none',
});

globalStyle(`:where(.${composerContainer}) .${editor} > :not(:first-child)`, {
  marginTop: `${Sizes.MESSAGE_PARAGRAPH_TOP_MARGIN}px`,
});

globalStyle(`:where(.${composerContainer}) .${placeholder}`, {
  bottom: 0,
  color: cssVar('color-content-secondary'),
  fontFamily: cssVar('font-family'),
  left: 0,
  pointerEvents: 'none',
  position: 'absolute',
  right: 0,
  top: 0,
});
