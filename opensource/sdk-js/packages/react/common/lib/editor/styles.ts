import { Sizes } from '../../const/Sizes.js';
import { getFontStyles } from '../../ui/atomicClasses/fonts.js';
import { cssVar } from '../../ui/cssVariables.js';
import {
  BOLD_STYLE,
  ITALIC_STYLE,
  UNDERLINE_STYLE,
  CODE_STYLE,
  QUOTE_STYLE,
  LINK_STYLE,
} from '../styles.js';

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
