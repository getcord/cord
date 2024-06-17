import type { GlobalStyleRule } from '@vanilla-extract/css'; // eslint-disable-line no-restricted-imports
import { cordifyClassname, defaultGlobalStyle } from 'common/ui/style.ts';
import { cursor } from '@cord-sdk/react/components/LiveCursors.classnames.ts';
import { comments } from '@cord-sdk/react/components/ThreadedComments.classnames.ts';

export const CORD_V2 = cordifyClassname('v2'); // v2 to match the npm package version when 4.0 was (will be) introduced.

/**
 * ThreadedComments and LiveCursor are half 4.0 components: they live in opensource,
 * but were there before the CSS 4.0 was in place. These components are used by clients,
 * and we can't update them: users have to install the newer SDK version.
 * To keep backwards compatibility with old versions of the SDK, we will continue serving
 * the old CSS, and scoping it with `:not(v4)` to avoid it leaking into the new versions.
 */
export function backwardsCompatibleGlobalStyle(
  selector: string,
  rule: GlobalStyleRule,
) {
  // We are wrapping `selector` in a `:where()`, and `:where(*::<pseudo-element>)`
  // is *not* a valid selector.
  if (selector.includes('::')) {
    throw new Error(
      `Cannot use pseudo selector with \`globalStyle\`.
        Please use \`defaultGlobalStyle\` and append :not(CORD_V2) manually. 
        Selector: ${selector}`,
    );
  }

  // Make sure to only target old components, that don't have versioned CSS.
  const backwardCompatibleSelector = `:where(.${comments}, .${cursor}):not(.${CORD_V2}) :where(${selector})`;
  return defaultGlobalStyle(backwardCompatibleSelector, rule);
}
