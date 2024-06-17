import { globalStyle } from 'common/ui/style.ts';
import * as classes from 'external/src/components/ui3/composer/FileAttachment.classnames.ts';
export const {
  fileBasename,
  fileContainer,
  fileExtension,
  fileInfo,
  fileName,
  fileSize,
  icon,
} = classes;

import { cssVar } from 'common/ui/cssVariables.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

globalStyle(`.${fileContainer}`, {
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('border-radius-medium'),
  color: cssVar('color-content-primary'),
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space-3xs'),
  height: `calc(${cssVar('space-xl')}*2)`,
  maxWidth: `calc(50% - (${cssVar('space-2xs')}/2))`,
  overflow: 'hidden',
  padding: cssVar('space-2xs'),
});
globalStyle(`.${fileContainer}:where(:not(.${MODIFIERS.error}))`, {
  cursor: 'pointer',
});

globalStyle(`:where(.${fileContainer}:not(.${MODIFIERS.error})):hover`, {
  boxShadow: cssVar('shadow-small'),
  color: cssVar('color-brand-primary'),
});

globalStyle(`:where(.${fileContainer}) .${fileName}`, {
  display: 'flex',
  whiteSpace: 'nowrap',
});

globalStyle(`:where(.${fileContainer}) .${fileInfo}`, {
  position: 'relative',
  overflow: 'hidden',
});

globalStyle(`:where(.${fileContainer}) .${icon}`, {
  flex: 'none',
  width: cssVar('space-l'),
  height: cssVar('space-l'),
});

globalStyle(`:where(.${fileContainer}) .${fileBasename}`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

globalStyle(`:where(.${fileContainer}:hover) .${fileSize}`, {
  display: 'none',
});
