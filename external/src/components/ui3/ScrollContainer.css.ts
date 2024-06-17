import { cssVar } from 'common/ui/cssVariables.ts';
import { inlineThread } from '@cord-sdk/react/components/Thread.classnames.ts';
import {
  CORD_V1,
  cordifyClassname,
  globalStyle,
  defaultGlobalStyle,
} from 'common/ui/style.ts';

export const scrollContainer = cordifyClassname('scroll-container');
globalStyle(`.${scrollContainer}`, {
  background: `linear-gradient(${cssVar(
    'color-base',
  )} 30%,rgba(255, 255, 255, 0)), linear-gradient(rgba(0, 0, 0, 0.08),rgba(0, 0, 0, 0))`,
  backgroundAttachment: 'local, scroll',
  backgroundPosition: 'top, top',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 10px, 100% 4px',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  overflow: 'auto',
  overflowAnchor: 'none', // Stops chrome automatically changing scroll when content added
  overscrollBehavior: 'contain', // Stops scroll chaining to main webpage
  position: 'relative',
});

/** Styling scrollContainer when inside other components  */
defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-thread-list) .${scrollContainer}`,
  {
    alignItems: 'center',
    gap: cssVar('space-xl'),
    height: '100%',
    padding: cssVar('space-2xs'),
  },
);

defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-thread-list) .${scrollContainer}:empty`,
  {
    // no padding when thread container is empty to avoid rendering a small
    // empty rectangle
    padding: 0,
  },
);

defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-notification-list, .${CORD_V1}.cord-component-notification-list-launcher) .${scrollContainer}`,
  {
    gap: cssVar('space-xs'),
    height: '100%',
    padding: cssVar('space-xs'),
  },
);

globalStyle(`:where(.${inlineThread}) .${scrollContainer}`, {
  gap: cssVar('space-2xs'),
  padding: cssVar('space-3xs'),
  paddingBottom: cssVar('space-2xs'),
});

globalStyle(
  `:where(.${cordifyClassname('full-height-thread')}) .${scrollContainer}`,
  {
    gap: cssVar('space-2xs'),
    padding: `${cssVar('space-m')} ${cssVar('space-2xs')}`,
  },
);

defaultGlobalStyle(
  `:where(.${CORD_V1}.cord-component-inbox, .${CORD_V1}.cord-component-inbox-launcher) .${scrollContainer}`,
  {
    gap: cssVar('space-xl'),
    maxHeight: '100%',
    padding: `${cssVar('space-xl')} ${cssVar('space-2xs')}`,
  },
);
