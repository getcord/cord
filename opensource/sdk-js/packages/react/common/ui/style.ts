import type { GlobalStyleRule, CSSProperties } from '@vanilla-extract/css';
import { globalStyle as defaultGlobalStyle } from '@vanilla-extract/css';
export { globalStyle as defaultGlobalStyle } from '@vanilla-extract/css';
export { keyframes } from '@vanilla-extract/css';
import { cordifyClassname } from '../cordifyClassname.js';

export type { CSSProperties };

export const CORD_V2 = cordifyClassname('v2'); // v2 to match the npm package version.
export function globalStyle(selector: string, rule: GlobalStyleRule) {
  // We are wrapping `selector` in a `:where()`, and `:where(*::<pseudo-element>)`
  // is *not* a valid selector.
  if (selector.includes('::')) {
    throw new Error(
      `Cannot use pseudo selector with \`globalStyle\`. 
      Please use \`defaultGlobalStyle\` and prepend CORD_V2 manually
      Selector: ${selector}`,
    );
  }
  // We wrap `selector` in a `:where` to keep the specificity of our selectors to 0,1,0
  const v4Selector = `:is(.${CORD_V2}, .${CORD_V2} *):where(${selector})`;
  return defaultGlobalStyle(v4Selector, rule);
}
