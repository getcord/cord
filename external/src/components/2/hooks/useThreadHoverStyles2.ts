import { createUseStyles } from 'react-jss';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';

// These are combined into a single createUseStyles because the stylesheets
// created by useStyles are limited to their own scope.

const VISIBLE_STYLES = {
  pointerEvents: 'auto',
  visibility: 'visible',
};

const INBOX_VISIBLE_STYLES = {
  width: 'auto',
  ...VISIBLE_STYLES,
};

const HIDDEN_STYLES = {
  pointerEvents: 'none',
  visibility: 'hidden',
};

// We need to take the button height into account when laying out the inbox
// thread header - but we DON'T want to take its width into account, so that
// the page title can be as long as possible before truncation.  This is why we
// use width: 0 here, so that the button width is not imposing on the title
// when it's hidden
const INBOX_HIDDEN_STYLES = {
  width: 0,
  overflow: 'hidden',
  ...HIDDEN_STYLES,
};

export const useThreadHoverStyles2 = createUseStyles({
  inlineThread: {
    // Needed to put shadow on expanded inbox thread
  },
  inboxThread: {
    '&:hover $inboxThreadOptionsButtonsHidden, &:hover $inboxThreadHeaderButtonsHidden':
      INBOX_VISIBLE_STYLES,
  },
  inboxThreadHeader: {
    padding: `${cssVar('space-2xs')} ${cssVar('space-3xs')} ${cssVar(
      'space-2xs',
    )} ${cssVar('space-2xs')}`,
  },
  expandedInboxThread: {
    '& $inboxThreadOptionsButtonsHidden, $inboxThreadHeaderButtonsHidden':
      INBOX_VISIBLE_STYLES,
    '& $inlineThread': {
      boxShadow: cssVar('shadow-small'),
    },
  },
  inboxThreadHeaderButtonsHidden: INBOX_HIDDEN_STYLES,
  inboxThreadHeaderButtonsVisible: INBOX_VISIBLE_STYLES,
  inboxThreadOptionsButtonsHidden: INBOX_HIDDEN_STYLES,
  inboxThreadOptionsButtonsVisible: INBOX_VISIBLE_STYLES,
  resolvedThreadHover: {
    '&:hover $resolvedThreadHeader': {
      paddingTop: cssVar('space-3xs'),
      paddingBottom: cssVar('space-3xs'),
    },
    '&:hover $resolvedThreadHoverButtons': {
      display: 'block',
    },
  },
  resolvedThreadHeader: {
    display: 'flex',
    paddingTop: addSpaceVars('4xs', '3xs'),
    paddingBottom: addSpaceVars('4xs', '3xs'),
    paddingLeft: cssVar('space-2xs'),
    paddingRight: cssVar('space-3xs'),
  },
  resolvedThreadHoverButtons: {
    display: 'none',
    marginLeft: 'auto',
  },
  collapsedThread: {
    '&:hover $collapsedThreadOptionsButtonHidden': VISIBLE_STYLES,
  },
  collapsedThreadOptionsButtonHidden: HIDDEN_STYLES,
  collapsedThreadOptionsButtonVisible: VISIBLE_STYLES,
  message: {
    '&:hover $messageOptionsButtonHidden': VISIBLE_STYLES,
    '&:hover $messageBlockHeaderSentViaHidden': VISIBLE_STYLES,
  },
  messageOptionsButtonHidden: HIDDEN_STYLES,
  messageOptionsButtonVisible: VISIBLE_STYLES,
  messageBlockHeaderSentViaHidden: HIDDEN_STYLES,
});
