import { CORD_V1, defaultGlobalStyle } from 'common/ui/style.ts';
import { cordCssVarName, cssVar } from 'common/ui/cssVariables.ts';
import { ThreadCSSOverrides } from 'sdk/client/core/css/overrides.ts';

defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-thread`, {
  display: 'block',
  backgroundColor: cssVar('color-base'),
  overflow: 'hidden',
  minWidth: '250px',
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('border-radius-medium'),
  position: 'relative',
});

// TODO Once we convert InlineThread we can fix this.
// Inline thread has some border, that will look like double border with the style above.
// We undo this.
defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-thread > *`, {
  [`--cord-${ThreadCSSOverrides.inlineThread.borderRadius}`]: 'none',
  [`--cord-${ThreadCSSOverrides.inlineThread.border}`]: 'none',
  [cordCssVarName('thread-border-top')]: 'none',
  [cordCssVarName('thread-border-right')]: 'none',
  [cordCssVarName('thread-border-bottom')]: 'none',
  [cordCssVarName('thread-border-left')]: 'none',
});
