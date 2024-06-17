import type { CSSProperties } from 'react';
import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../../common/ui/style.js';
import { Sizes } from '../../common/const/Sizes.js';
import { cordifyClassname } from '../../common/cordifyClassname.js';
import { editorStyles } from '../../common/lib/editor/styles.js';

export const messageText = cordifyClassname('message-text');
globalStyle(`.${messageText}`, {
  ...editorStyles,
  gridArea: 'messageText',
});

globalStyle(`.${messageText} > :where(:not(:first-child))`, {
  marginTop: `${Sizes.MESSAGE_PARAGRAPH_TOP_MARGIN}px`,
});

defaultGlobalStyle(
  `:where(.cord-component-thread-list.${CORD_V2}) .${messageText}`,
  {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    // Supported on latest versions of Chrome, Edge, Safari, FF and Opera.
    '-webkit-line-clamp': 'none',
  } as CSSProperties,
);

export const structuredMessageCustomRenderNode = cordifyClassname(
  'structured-message-custom-render-node',
);
globalStyle(`.${structuredMessageCustomRenderNode}`, {
  display: 'contents',
});
