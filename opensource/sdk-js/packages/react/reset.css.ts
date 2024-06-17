import { CORD_V2, globalStyle } from './common/ui/style.js';
import { Sizes } from './common/const/Sizes.js';

function addPrefix(selectors: string[], prefix = CORD_V2) {
  return (
    selectors
      // We use `:where(<selector>)` to not bump the specificity, allowing
      // developers to more easily override our styles.
      // Example output: `.cord-component :where(img)`. This has specificity (0, 1, 0)
      // rather than (0, 1, 1), so developers can override with `.cord-component img`,
      // no matter where they specify this style.
      .map((selector) => `.${prefix} :where(${selector})`)
      .join(', ')
  );
}

// Will target the topmost element, e.g. a Message, but not a Message inside a Thread.
const topLevelComponentSelector = `.${CORD_V2}:not(.${CORD_V2} .${CORD_V2})`;
/**
 * This reset is applied to our components.
 */
globalStyle(topLevelComponentSelector, {
  fontFamily: 'inherit',
  fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
  fontSmooth: 'auto',
  letterSpacing: 'normal',
  lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
  textTransform: 'none',
});
globalStyle(
  addPrefix([
    'a',
    'abbr',
    'acronym',
    'address',
    'applet',
    'article',
    'aside',
    'audio',
    'b',
    'big',
    'blockquote',
    'canvas',
    'caption',
    'center',
    'cite',
    'code',
    'dd',
    'del',
    'details',
    'dfn',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'i',
    'iframe',
    'img',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'mark',
    'menu',
    'nav',
    'object',
    'ol',
    'output',
    'p',
    'pre',
    'q',
    'ruby',
    's',
    'samp',
    'section',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'tt',
    'u',
    'ul',
    'var',
    'video',
  ]),
  {
    border: '0',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    fontSize: '100%',
    margin: '0',
    padding: '0',
    textTransform: 'none',
    verticalAlign: 'baseline',
  },
);
globalStyle(
  addPrefix([
    'article',
    'aside',
    'details',
    'figcaption',
    'figure',
    'footer',
    'header',
    'hgroup',
    'menu',
    'nav',
    'section',
  ]),
  { display: 'block' },
);
globalStyle(addPrefix(['img']), {
  maxBlockSize: 'initial',
  maxInlineSize: 'initial',
});
globalStyle(addPrefix(['button', 'select']), {
  borderStyle: 'none',
  fontFamily: 'inherit',
  fontSize: Sizes.DEFAULT_TEXT_SIZE_PX + 'px',
  lineHeight: Sizes.DEFAULT_LINE_HEIGHT_PX + 'px',
  margin: 0,
  padding: 0,
  textTransform: 'none',
});
globalStyle(addPrefix(['ol', 'ul']), {
  listStyle: 'none',
});
globalStyle(addPrefix(['blockquote', 'q']), { quotes: 'none' });
globalStyle(
  addPrefix(['blockquote:before', 'blockquote:after', 'q:before', 'q:after']),
  {
    content: 'none',
  },
);
globalStyle(addPrefix(['table']), {
  borderCollapse: 'collapse',
  borderSpacing: 0,
});
globalStyle(addPrefix(['input']), {
  boxSizing: 'border-box',
  font: 'inherit',
  fontSize: '100%',
  lineHeight: 'inherit',
  margin: 0,
  padding: 0,
});
