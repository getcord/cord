import { addSpaceVars, cssVar } from '../../common/ui/cssVariables.js';
import { MODIFIERS, getModifiedSelector } from '../../common/ui/modifiers.js';
import {
  CORD_V2,
  defaultGlobalStyle,
  globalStyle,
} from '../../common/ui/style.js';
import { composerContainer } from '../../components/Composer.classnames.js';
import * as classes from '../../components/Message.classnames.js';
import {
  threads,
  inlineThreadTopLevelMessage,
} from '../threads/Threads.classnames.js';
export * from '../../components/Message.classnames.js';

const {
  authorName,
  deletedIcon,
  deletedMessageText,
  message,
  undoDeleteButton,
  messageOptionsButtons,
  messageClassnamesDocs: _,
} = classes;

const BULLET_CHARACTER = '\\2022';

globalStyle(`.${message}`, {
  backgroundColor: cssVar('color-base'),
  borderRadius: cssVar('border-radius-medium'),
  position: 'relative',
});

globalStyle(`.${message}:not(.${composerContainer})`, {
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  display: 'grid',
  gridTemplateColumns: `20px auto auto auto 1fr auto`,
  gridTemplateRows: `24px 1fr auto`,
  gridGap: `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
  alignItems: 'center',
  gridTemplateAreas: `
    "avatar authorName timestamp . . optionsMenu"
    ". messageContent messageContent messageContent messageContent optionsMenu"
    ". reactions reactions reactions reactions ."`,
});

globalStyle(getModifiedSelector('resolved', ` .${message}`), {
  backgroundColor: 'inherit',
});

globalStyle(getModifiedSelector('highlighted', ` .${message}`), {
  backgroundColor: 'inherit',
});

const actionMessage = {
  color: cssVar('color-content-primary'),
  gridTemplateRows: '24px',
  gridTemplateColumns: '20px auto 1fr',
  gridTemplateAreas: `"icon message"`,
};
globalStyle(
  `.${message}:where(.${MODIFIERS.action}, .${MODIFIERS.deleted})`,
  actionMessage,
);
globalStyle(getModifiedSelector('editing', `.${message}`), {
  gridTemplateRows: 'auto',
  gridTemplateColumns: '20px auto',
  gridTemplateAreas: `"avatar messageContent"`,
  alignItems: 'start',
});

globalStyle(`.${authorName}`, {
  alignSelf: 'baseline',
  color: cssVar('color-content-emphasis'),
  gridArea: 'authorName',
  marginTop: cssVar('space-3xs'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`.${undoDeleteButton}`, {
  color: cssVar('color-content-emphasis'),
  cursor: 'pointer',
  display: 'inline-block',
});
defaultGlobalStyle(
  `:where(.${message}.${CORD_V2}) .${undoDeleteButton}::before`,
  {
    content: BULLET_CHARACTER,
    color: cssVar('color-content-primary'),
    margin: `0 ${cssVar('space-3xs')}`,
  },
);

globalStyle(`.${deletedMessageText}`, {
  textOverflow: 'ellipsis',
  gridArea: 'message',
});

globalStyle(`.${deletedIcon}`, {
  gridArea: 'icon',
});

globalStyle(`.${messageOptionsButtons}`, {
  display: 'flex',
  gridArea: 'optionsMenu',
  alignSelf: 'flex-start',
  gap: cssVar('space-3xs'),
  background: 'transparent',
  borderRadius: cssVar('space-3xs'),
  paddingTop: cssVar('space-3xs'),
});
globalStyle(`.${message} .${messageOptionsButtons}`, {
  paddingTop: '0px',
  flexDirection: 'column',
  pointerEvents: 'none',
  visibility: 'hidden',
});
globalStyle(`.${message}:hover .${messageOptionsButtons}`, {
  visibility: 'visible',
  pointerEvents: 'auto',
});

globalStyle(`.${message} .${messageOptionsButtons}.${MODIFIERS.open}`, {
  // Never hide the menu and its contents if the popper is open.
  visibility: 'visible',
});

globalStyle(`.${threads} .${message}:not(.${inlineThreadTopLevelMessage})`, {
  marginLeft: addSpaceVars('l', '2xs'),
});
