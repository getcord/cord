/**
 * This CSS exists to support clients on old version of the SDK.
 * Specifically, on version before Cord 4.0 CSS was versioned.
 */
import * as classes from '@cord-sdk/react/components/LiveCursors.classnames.ts';
import {
  cordifyClassname,
  defaultGlobalStyle,
  keyframes,
} from 'common/ui/style.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import {
  CORD_V2,
  backwardsCompatibleGlobalStyle,
} from 'sdk/client/core/css/backwardsCompatibleStyle.ts';
import { POSITION_UPDATE_INTERVAL_MS } from '@cord-sdk/react/components/LiveCursors.tsx';

export const { cursor, icon, label, name } = classes;

// A small negative margin makes the pointer of the icon and click appear where the
// other user's cursor actually is
export const CURSOR_MARGIN_OFFSET = -2;

export const colorPalette = cordifyClassname('color-palette');
export const cursorClick = cordifyClassname('live-cursors-click');

export const colorVar = '--cord-live-cursors-cursor-color';
export const borderVar = '--cord-live-cursors-cursor-border-color';

defaultGlobalStyle(`.${cursor}:not(.${CORD_V2})`, {
  marginLeft: CURSOR_MARGIN_OFFSET,
  marginTop: CURSOR_MARGIN_OFFSET,
  padding: 0,
  position: 'fixed',
  zIndex: ZINDEX.annotation,
  transition: `all ${POSITION_UPDATE_INTERVAL_MS}ms linear`,
});

backwardsCompatibleGlobalStyle(`.${icon}`, {
  color: `var(${colorVar})`,
});

backwardsCompatibleGlobalStyle(`.${label}`, {
  border: `1px solid var(${borderVar})`,
  borderRadius: '100px',
  color: 'white',
  padding: '4px 12px',
  position: 'absolute',
  top: '11px',
  left: '10px',
  whiteSpace: 'nowrap',
  backgroundColor: `var(${colorVar})`,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const rippleEffect = keyframes({
  '100%': {
    opacity: 0.01,
    transform: 'scale(15)',
  },
});

backwardsCompatibleGlobalStyle(`.${cursorClick}`, {
  animation: `${rippleEffect} 0.4s linear`,
  animationDirection: 'alternate',
  animationIterationCount: 'infinite',
  backgroundColor: 'transparent',
  border: `1px solid var(${colorVar})`,
  borderRadius: '50%',
  height: '10px',
  marginLeft: CURSOR_MARGIN_OFFSET,
  marginTop: CURSOR_MARGIN_OFFSET,
  pointerEvents: 'none',
  position: 'fixed',
  width: '10px',
  zIndex: ZINDEX.annotation,
});

// The set of colors we rotate between as we need colors for people.
const CURSOR_COLORS = [
  { background: '#8462cc', border: '#533d80' },
  { background: '#cc566c', border: '#803644' },
  { background: '#ca6037', border: '#7d3c22' },
  { background: '#c361aa', border: '#753b66' },
  { background: '#688bcd', border: '#415780' },
  { background: '#b49242', border: '#695527' },
  { background: '#70a845', border: '#3e5c26' },
  { background: '#4aac8d', border: '#295e4d' },
];

for (let i = 0; i < CURSOR_COLORS.length; i++) {
  defaultGlobalStyle(
    `:is(.${cursor}:not(.${CORD_V2}), .${cursorClick}):where(.${colorPalette}-${
      i + 1
    })`,
    {
      vars: {
        [borderVar]: CURSOR_COLORS[i].border,
        [colorVar]: CURSOR_COLORS[i].background,
      },
    },
  );
}
