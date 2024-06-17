import type { Color } from 'common/const/Colors.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { trimStart } from '@cord-sdk/react/common/lib/trim.ts';

const MODAL_BACKGROUND_ALPHA_LIGHT = 0.33;
const MODAL_BACKGROUND_ALPHA_DARK = 0.66;

export const Styles = {
  // Messages
  DEFAULT_SHADOW: `0 ${Sizes.XSMALL}px ${Sizes.SMALL}px 0 rgba(0, 0, 0, 0.1)`,
  TOP_BAR_BOTTOM_BORDER: `1px ${Colors.GREY_LIGHT} solid`,

  // Modal
  MODAL_BACKGROUND_ALPHA_LIGHT,
  MODAL_BACKGROUND_ALPHA_DARK,
  MODAL_BACKGROUND_COLOR_LIGHT: `rgba(0, 0, 0, ${MODAL_BACKGROUND_ALPHA_LIGHT})`,
  MODAL_BACKGROUND_COLOR_DARK: `rgba(0, 0, 0, ${MODAL_BACKGROUND_ALPHA_DARK})`,
  IMAGE_MODAL_SHADOW_FILTER:
    'drop-shadow(0px 4px 2px rgba(0, 0, 0, 0.1)) drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.2))',

  // Loading spinner shown in each tab (Inbox, activity, etc)
  THREAD_CIRCULAR_LOADING: {
    height: `calc(100% - ${Sizes.LARGE}px)`,
    width: `calc(100% - ${Sizes.LARGE}px)`,
  },
};

export const DEFAULT_CSS_MUTATOR_CONFIG = {
  cssTemplate: 'html { margin-right: {{width}}px !important; }',
};

function hexToRgb(color: string) {
  const hex = trimStart(color.trim(), '#').trim();
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Linear gradients don't work on safari using transparent as one of the values
// Solution is to use the transparent version of the other color
// https://css-tricks.com/thing-know-gradients-transparent-black/
export function transparentColor(color: Exclude<Color, 'TRANSPARENT'>) {
  const rgb = hexToRgb(Colors[color]);
  return `${rgb.slice(0, rgb.length - 1)}, 0)`;
}

export const SHADOW_ROOT_ID = '__SHADOW_ROOT_ID__';
const bodyAndShadowRootSelector = `body, #${SHADOW_ROOT_ID}` as const;

// TODO Get rid of this when removing useShadowRoot = false
export const createCordCSS = (
  fontFamily: string = cssVar('font-family'),
  additionalGlobalRules?: { [key: string]: React.CSSProperties },
) => ({
  '@global': {
    ':host': {
      // we don't want to inherit CSS properties (e.g. text-align: center) from the main page
      all: 'initial',
      // except for fontFamily which we might want to inherit
      fontFamily,
    },
    ...additionalGlobalRules,
    'html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video':
      {
        border: '0',
        boxSizing: 'border-box',
        fontFamily,
        fontSize: '100%',
        margin: '0',
        padding: '0',
        textTransform: 'none',
        verticalAlign: 'baseline',
      },
    'article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section':
      {
        display: 'block',
      },
    [bodyAndShadowRootSelector]: {
      fontFamily,
      fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
      lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
      letterSpacing: 'normal',
      fontSmooth: 'auto',
      textTransform: 'none',
    },
    'select, button': {
      borderStyle: 'none',
      fontFamily,
      fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
      lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
      margin: 0,
      padding: 0,
      textTransform: 'none',
    },
    'ol, ul': {
      listStyle: 'none',
    },
    'blockquote, q': {
      quotes: 'none',
    },
    'blockquote:before, blockquote:after, q:before, q:after': {
      content: 'none',
    },
    table: {
      borderCollapse: 'collapse',
      borderSpacing: 0,
    },
    input: {
      boxSizing: 'border-box',
      fontSize: '100%',
      font: 'inherit',
      lineHeight: 'inherit',
      margin: 0,
      padding: 0,
      '&::placeholder': {
        color: Colors.GREY,
      },
    },
  },
});

// In the inbox 'read' section, we grey most text
// This is to opt an element out of that
export const NOT_GREYABLE_CLASS_NAME = '__cord-not-greyable';
