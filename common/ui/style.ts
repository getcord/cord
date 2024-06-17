// We do the re-export here. So we can restrict it elsewhere.
// eslint-disable-next-line no-restricted-imports
import {
  style as internalStyle,
  globalStyle as defaultGlobalStyle,
  globalKeyframes,
  keyframes,
} from '@vanilla-extract/css';
// eslint-disable-next-line no-restricted-imports
import type {
  StyleRule,
  CSSProperties,
  GlobalStyleRule,
} from '@vanilla-extract/css';

export type { StyleRule, CSSProperties };
export { internalStyle, globalKeyframes, keyframes, defaultGlobalStyle };

/**
 * We want/need our user to have readable classname to allow them style our compoment from the outside, easily.
 * But we still want to internally style them with unique generated classname to avoid classname collision,
 * and without having to increase specificity (or that would make the above harder).
 *
 * Use this at all cost. Please.
 *
 *
 **/
export default function style(
  userReadableClassname: string,
  styles: StyleRule,
) {
  // instead of concatenating the userReadableClassname with the generated classname by ourself, we let vanilla extract do it for us.
  // This avoid breaking using the generated classname in complex selectors.
  // https://vanilla-extract.style/documentation/style-composition#style-composition:~:text=However%2C%20what%20if%20we%20want%20to%20use%20our%20style%20inside%20another%20styles%20selector%3F
  return internalStyle([cordifyClassname(userReadableClassname), styles]);
}

/**
 * Prepend "cord-" to a classname. Useful mostly to grep all places
 * where we've added a stable classname.
 */
export function cordifyClassname(className: string) {
  return `cord-${className}`;
}

export const CORD_COMPONENT_BASE_CLASS = 'cord-component';
export const CORD_V1 = cordifyClassname('v1'); // v1 to match the npm package version.
export function globalStyle(selector: string, rule: GlobalStyleRule) {
  // We are wrapping `selector` in a `:where()`, and `:where(*::<pseudo-element>)`
  // is *not* a valid selector.
  if (selector.includes('::')) {
    throw new Error(
      `Cannot use pseudo selector with \`globalStyle\`.
      Please use \`defaultGlobalStyle\` and prepend CORD_V1 manually. 
      Selector: ${selector}`,
    );
  }
  // We wrap `selector` in a `:where` to keep the specificity of our selectors to 0,1,0
  const v3Selector = `.${CORD_COMPONENT_BASE_CLASS}:where(.${CORD_V1}) :where(${selector})`;
  // Cord 3.0 (v1) were our first fully CSS customisable components.
  // To avoid clashes with the new set of components 4.0 (v2),
  // we version the old CSS.
  return defaultGlobalStyle(v3Selector, rule);
}
