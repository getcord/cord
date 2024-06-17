// Rough initial style workings: https://docs.google.com/spreadsheets/d/1dlk9R5sdvnWkXdbXgKqnL-jCRbaz7Za-Yaiv6NZRt8I/edit?usp=sharing

export function getStylesToClone(
  mode: 'base' | 'grid' | 'svg' | 'flex' | 'offScreen' | 'takesNoSpace',
) {
  switch (mode) {
    case 'takesNoSpace':
      return TAKES_NO_SPACE_STYLES;
    case 'offScreen':
      return OFF_SCREEN_STYLES;
    case 'base':
      return BASE_STYLES;
    case 'flex':
      return FLEX_STYLES;
    case 'svg':
      return SVG_STYLES;
    case 'grid':
      return GRID_STYLES;
  }
}

const TAKES_NO_SPACE_STYLES = [
  'display',
  'height',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'opacity',
  'overflow',
  'position',
  'transform',
  'visibility',
  'width',
  'zIndex',
];

const OFF_SCREEN_STYLES = [
  'align-self',
  'border-bottom-width',
  'border-left-width',
  'border-right-width',
  'border-top-width',
  'box-sizing',
  'clear',
  'display',
  'float',
  'height',
  'left',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'opacity',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'position',
  'right',
  'top',
  'transform',
  'visibility',
  'width',
  'zIndex',
];

const BASE_STYLES = [
  'align-self',
  'background-color',
  'background-image',
  'background-origin',
  'background-position',
  'background-repeat',
  'background-size',
  'border-bottom-color',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-bottom-style',
  'border-bottom-width',
  'border-collapse',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-spacing',
  'border-top-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-top-style',
  'border-top-width',
  'bottom',
  'box-shadow',
  'box-sizing',
  'clear',
  'clip',
  'color',
  'display',
  'direction',
  'unicode-bidi',
  'filter',
  'float',
  'font-family',
  'font-kerning',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-weight',
  'gap',
  'height',
  'hyphens',
  'left',
  'letter-spacing',
  'line-break',
  'line-height',
  'list-style',
  'list-style-image',
  'list-style-position',
  'list-style-type',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'opacity',
  'order',
  'outline-color',
  'outline-offset',
  'outline-style',
  'outline-width',
  'overflow-wrap',
  'overflow-x',
  'overflow-y',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'position',
  'right',
  'text-align',
  'text-align-last',
  'text-decoration-color',
  'text-decoration-line',
  'text-decoration-style',
  'text-indent',
  'text-overflow',
  'text-transform',
  'top',
  'transform',
  'transform-origin',
  'transform-style',
  'vertical-align',
  'visibility',
  'white-space',
  'width',
  'word-break',
  'word-spacing',
  'word-wrap',
  'z-index',

  // Grid item styles. Put here as easier than working out if parent is display:
  // 'grid' (as cloneNode is recursive, so children get done before parents)
  'grid-area',
  'grid-column-end',
  'grid-column-start',
  'grid-row-end',
  'grid-row-start',

  '-webkit-font-smoothing',
];

const FLEX_STYLES = [
  ...BASE_STYLES,
  'align-content',
  'align-items',
  'flex-direction',
  'flex-wrap',
  'justify-content',
];

const GRID_STYLES = [
  ...BASE_STYLES,
  ...FLEX_STYLES,
  'grid-auto-columns',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-column-gap',
  'grid-row-gap',
  'grid-template-areas',
  'grid-template-columns',
  'grid-template-rows',
];

const SVG_STYLES = [
  ...BASE_STYLES,
  'cx',
  'cy',
  'd',
  'clip-path',
  'clip-rule',
  'fill',
  'fill-opacity',
  'fill-rule',
  'mask-type',
  'rx',
  'ry',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'vector-effect',
  'x',
  'y',
];

export const ALL_STYLES = [
  ...new Set([...BASE_STYLES, ...GRID_STYLES, ...FLEX_STYLES, ...SVG_STYLES]),
];
