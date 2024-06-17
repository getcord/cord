import { CORD_V1, defaultGlobalStyle, globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';

import { unreadMessageIndicator } from '@cord-sdk/react/components/Thread.classnames.ts';
export { unreadMessageIndicator };

globalStyle(`.${unreadMessageIndicator}`, {
  alignItems: 'center',
  color: cssVar('color-content-emphasis'),
  display: 'flex',
  gap: `${cssVar('space-2xs')}`,
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  paddingInlineStart: `calc(2 * ${cssVar('space-2xs')} + 20px)`,
  position: 'relative',
});

defaultGlobalStyle(
  `:where(.${CORD_V1}) ${getModifiedSelector(
    'subscribed',
    `.${unreadMessageIndicator}`,
  )}::before`,
  {
    alignItems: 'center',
    background: cssVar('color-notification'),
    border: `1px solid ${cssVar('color-base')}`,
    borderRadius: '50%',
    color: cssVar('color-base'),
    content: '',
    height: cssVar('space-xs'),
    // Align to the right of first column
    // padding + column size - badge size
    insetInlineStart: `calc(${cssVar('space-2xs')} + 20px - 1 * ${cssVar(
      'space-xs',
    )})`,
    pointerEvents: 'none',
    position: 'absolute',
    width: cssVar('space-xs'),
  },
);
