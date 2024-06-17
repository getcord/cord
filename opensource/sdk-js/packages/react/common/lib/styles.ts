import { Colors } from '../const/Colors.js';
import { Sizes } from '../const/Sizes.js';
import { cssVar } from '../ui/cssVariables.js';

const Fonts = {
  CODE: 'monospace',
};

export const BOLD_STYLE: React.CSSProperties = { fontWeight: 'bold' };
export const ITALIC_STYLE: React.CSSProperties = { fontStyle: 'italic' };
export const UNDERLINE_STYLE: React.CSSProperties = {
  textDecoration: 'underline',
};

// There is a bug in Chromium for some emojis which means we override the normal
// font-family range with this emoji-specific selection in some places. See #1313
export const EMOJI_STYLE: React.CSSProperties = {
  fontFamily: 'Apple Color Emoji, Segoe UI Emoji',
};

export const PARAGRAPH_STYLE: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
};

export const QUOTE_STYLE: React.CSSProperties = {
  borderLeft: `1px solid ${Colors.GREY_LIGHT}`,
  paddingLeft: `${Sizes.MEDIUM}px`,
};

export const CODE_STYLE: React.CSSProperties = {
  background: cssVar('color-base-strong'),
  border: '1px solid ' + cssVar('color-base-x-strong'),
  borderRadius: `${Sizes.SMALL}px`,
  fontFamily: Fonts.CODE,
  fontSize: `${Sizes.SMALL_TEXT_SIZE_PX}px`,
  padding: `${Sizes.XSMALL}px ${Sizes.XSMALL}px ${Sizes.XSMALL}px ${Sizes.MEDIUM}px`,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
};

export const LINK_STYLE: Record<
  string,
  string | React.CSSProperties | { [key: string]: string | React.CSSProperties }
> = {
  // Stop link overflowing message
  overflowWrap: 'anywhere',
};
