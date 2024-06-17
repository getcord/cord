import {
  addSpaceVars,
  cssVar,
  cssVarWithCustomFallback,
} from '../../../common/ui/cssVariables.js';
import { getModifiedSelector } from '../../../common/ui/modifiers.js';
import { globalStyle } from '../../../common/ui/style.js';
import * as classes from '../../../components/helpers/Button.classnames.js';
import { notificationContainer } from '../../../components/Notification.classnames.js';
import { imageModalOverlay } from '../../../components/MediaModal.classnames.js';
import { resolvedThreadHeader } from '../../../components/Thread.classnames.js';
import {
  alwaysExpand,
  autoExpand,
  composerContainer,
  hasAttachments,
} from '../../../components/Composer.classnames.js';
import {
  collapseInlineThreadButton,
  inlineReplyButton,
  threads,
} from '../../../canary/threads/Threads.classnames.js';

export default classes;

const {
  button,
  colorsPrimary,
  colorsSecondary,
  colorsTertiary,
  large,
  medium,
  small,
  text,
  icon,
  sendButton,
  closeButton,
  buttonLabel,
} = classes;

globalStyle(`.${button}`, {
  alignItems: 'center',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '100%',
  position: 'relative',
  textAlign: 'center',
  border: cssVar('button-border-none'),
  borderRadius: cssVar('border-radius-medium'),
});

globalStyle(`.${buttonLabel}`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`:where(.${button}).${colorsPrimary}`, {
  backgroundColor: cssVar(`primary-button-background-color`),
  color: cssVar(`primary-button-content-color`),
});

globalStyle(`:where(.${button}).${colorsPrimary}:active`, {
  backgroundColor: cssVar(`primary-button-background-color--active`),
  color: cssVar(`primary-button-content-color--active`),
});
globalStyle(`:where(.${button}).${colorsPrimary}:disabled`, {
  backgroundColor: cssVar(`primary-button-background-color--disabled`),
  color: cssVar(`primary-button-content-color--disabled`),
  cursor: 'unset',
});
globalStyle(
  `.${button}:where(.${colorsPrimary}:not(:active):not(:disabled)):hover`,
  {
    backgroundColor: cssVar(`primary-button-background-color--hover`),
    color: cssVar(`primary-button-content-color--hover`),
  },
);

globalStyle(`:where(.${button}).${colorsSecondary}`, {
  backgroundColor: cssVar(`secondary-button-background-color`),
  color: cssVar(`secondary-button-content-color`),
});

globalStyle(`:where(.${button}).${colorsSecondary}:active`, {
  backgroundColor: cssVar(`secondary-button-background-color--active`),
  color: cssVar(`secondary-button-content-color--active`),
});
globalStyle(`:where(.${button}).${colorsSecondary}:disabled`, {
  backgroundColor: cssVar(`secondary-button-background-color--disabled`),
  color: cssVar(`secondary-button-content-color--disabled`),
  cursor: 'unset',
});
globalStyle(
  `.${button}:where(.${colorsSecondary}:not(:active):not(:disabled)):hover`,
  {
    backgroundColor: cssVar(`secondary-button-background-color--hover`),
    color: cssVar(`secondary-button-content-color--hover`),
  },
);

globalStyle(`:where(.${button}).${colorsTertiary}`, {
  backgroundColor: cssVar(`tertiary-button-background-color`),
  color: cssVar(`tertiary-button-content-color`),
});

globalStyle(`:where(.${button}).${colorsTertiary}:active`, {
  backgroundColor: cssVar(`tertiary-button-background-color--active`),
  color: cssVar(`tertiary-button-content-color--active`),
});
globalStyle(`:where(.${button}).${colorsTertiary}:disabled`, {
  backgroundColor: cssVar(`tertiary-button-background-color--disabled`),
  color: cssVar(`tertiary-button-content-color--disabled`),
  cursor: 'unset',
});
globalStyle(
  `.${button}:where(.${colorsTertiary}:not(:active):not(:disabled)):hover`,
  {
    backgroundColor: cssVar(`tertiary-button-background-color--hover`),
    color: cssVar(`tertiary-button-content-color--hover`),
  },
);

globalStyle(`:where(.${button}) svg`, {
  color: 'inherit',
  // make sure that the icon does not change it's size
  flex: 'none',
});

globalStyle(`.${button}:where(.${small}.${text}:not(.${icon}))`, {
  padding: cssVarWithCustomFallback(
    'button-small-text-only-padding',
    `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
  ),
});

globalStyle(`.${button}:where(.${small}.${icon}:not(.${text}))`, {
  padding: cssVarWithCustomFallback(
    'button-small-icon-only-padding',
    cssVar('space-3xs'),
  ),
});
globalStyle(`.${button}:where(.${small}.${icon}.${text})`, {
  gap: cssVar('space-3xs'),
  padding: cssVarWithCustomFallback(
    'button-small-icon-and-text-padding',
    `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
  ),
});

globalStyle(`.${button}:where(.${medium}.${text}:not(.${icon}))`, {
  padding: cssVarWithCustomFallback(
    'button-medium-text-only-padding',
    cssVar('space-2xs'),
  ),
});

globalStyle(`.${button}:where(.${medium}.${icon}:not(.${text}))`, {
  padding: cssVarWithCustomFallback(
    'button-medium-icon-only-padding',
    addSpaceVars('4xs', '3xs'),
  ),
});

globalStyle(`.${button}:where(.${medium}.${icon}.${text})`, {
  gap: cssVar('space-3xs'),
  padding: cssVarWithCustomFallback(
    'button-medium-icon-and-text-padding',
    `${addSpaceVars('4xs', '3xs')} ${cssVar('space-2xs')}`,
  ),
});

globalStyle(`.${button}:where(.${large}.${text}:not(.${icon}))`, {
  padding: cssVarWithCustomFallback(
    'button-large-text-only-padding',
    `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
  ),
});

globalStyle(`.${button}:where(.${large}.${icon}:not(.${text}))`, {
  padding: cssVarWithCustomFallback(
    'button-large-icon-only-padding',
    addSpaceVars('4xs', '2xs'),
  ),
});

globalStyle(`.${button}:where(.${large}.${icon}.${text})`, {
  gap: cssVar('space-2xs'),
  padding: cssVarWithCustomFallback(
    'button-large-icon-and-text-padding',
    `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
  ),
});

/** CUSTOM STYLES **/
globalStyle(`:where(.${composerContainer}) .${sendButton}`, {
  borderRadius: cssVar('border-radius-round'),
});
globalStyle(`:where(.${composerContainer}) .${closeButton}`, {
  borderRadius: cssVar('border-radius-round'),
});
globalStyle(
  `.${composerContainer}:where(.${alwaysExpand}, .${autoExpand}:focus-within, .${hasAttachments}) :where(.${sendButton}, .${closeButton})`,
  {
    padding: cssVar('space-2xs'),
    height: cssVar('space-2xl'),
  },
);

globalStyle(
  `.${composerContainer}:where(.${small}) :where(.${sendButton}, .${closeButton})`,
  {
    padding: cssVar('space-3xs'),
    height: cssVar('space-xl'),
  },
);

globalStyle(`:where(.${resolvedThreadHeader}) .${button}`, {
  visibility: 'hidden',
  pointerEvents: 'none',
  margin: '4px',
  marginLeft: 'auto',
});
globalStyle(`:where(.${resolvedThreadHeader}:hover) .${button}`, {
  visibility: 'visible',
  pointerEvents: 'auto',
});

globalStyle(`:where(.${notificationContainer}) .${button}`, {
  backgroundColor: 'transparent',
  pointerEvents: 'none',
  visibility: 'hidden',
});

globalStyle(`:where(.${notificationContainer}:hover) .${button}`, {
  pointerEvents: 'auto',
  visibility: 'visible',
});

globalStyle(getModifiedSelector('active', `.${button}`), {
  backgroundColor: cssVar('secondary-button-background-color--hover'),
  color: cssVar('secondary-button-content-color--hover'),
});

globalStyle(
  `:where(.${imageModalOverlay}) .cord-button:is([data-cord-button='show-next-image'], [data-cord-button='show-previous-image'])`,
  {
    position: 'absolute',
    top: '50%',
    translate: '0 -50%',
  },
);

globalStyle(
  `:where(.${imageModalOverlay}) .cord-button[data-cord-button='show-previous-image']`,
  {
    left: 4,
  },
);
globalStyle(
  `:where(.${imageModalOverlay}) .cord-button[data-cord-button='show-next-image']`,
  {
    right: 4,
  },
);

globalStyle(
  `.${threads} :is(.${inlineReplyButton}, .${collapseInlineThreadButton})`,
  {
    justifyContent: 'flex-start',
    margin: `0 ${cssVar('space-3xs')} 0 ${cssVar('space-2xs')}`,
    color: cssVar('color-brand-primary'),
  },
);

globalStyle(`.${inlineReplyButton} .${button}`, {
  background: 'none',
});
