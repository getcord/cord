import { cssVar } from 'common/ui/cssVariables.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { getFontStyles } from 'common/ui/fonts.ts';

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

export const editorStyles: Record<
  string | number,
  | string
  | number
  | React.CSSProperties
  | { [key: string]: string | React.CSSProperties | number }
> = {
  wordBreak: 'break-word',
  '& strong': BOLD_STYLE,
  '& em': ITALIC_STYLE,
  '& u': UNDERLINE_STYLE,
  '& pre': CODE_STYLE,
  '& blockquote': QUOTE_STYLE,
  // Without this, non-editable elements mess up selection:
  // - Deleting a selection with non-editable elements doesn't work
  // - When dragging cursor to select, it would be cancelled by going over a non-editable element
  '& div[contenteditable="false"]': {
    userSelect: 'none',
  },
  color: cssVar('color-content-primary'),
  ...getFontStyles({ font: 'body' }),
  '& a': {
    ...LINK_STYLE,
    ...(getFontStyles({ font: 'body' }) as any),
  },
};

export const todoStyles = {
  flex: 1,
  // Make sure bullet has height even when no content
  minHeight: Sizes.DEFAULT_LINE_HEIGHT_PX,
  paddingLeft: Sizes.BULLET_PADDING_LEFT,
  position: 'relative',
};

export const todoContainerStyles = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'flex-end',
  left: 0,
  position: 'absolute',
  top: 0,
  width: Sizes.CHECKBOX_DEFAULT_SIZE_PX,
};

// For any bullet components that use the li tag
export const baseBulletStylesMessageElement = {
  // Remove bottom margin on last child
  '&:last-child $listItem p': {
    marginBottom: '0px !important',
  },
};

export const listItemStyles = {
  listStyle: ({ numberBullet }: { numberBullet?: boolean }) =>
    numberBullet ? 'decimal' : 'disc',
};
