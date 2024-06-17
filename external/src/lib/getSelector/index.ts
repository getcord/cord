import {
  getMonacoLineSelector,
  isMonacoLine,
  isWithinMonacoEditor,
} from 'external/src/delegate/annotations/util.ts';
import type { FinderNode } from 'external/src/lib/getSelector/finder.ts';
import { finder, cssesc } from 'external/src/lib/getSelector/finder.ts';

const DEFAULT_THRESHOLD = 1000;

// This attribute name is exposed publicly in the API docs.
// Clients can add this data attribute to elements they
// want us to target reliably.
export const CORD_TARGET_ATTRIBUTE_NAME = 'data-cord-annotation-target';

const EXCLUDED_CLASS_NAMES = ['select', 'hover', 'focus', '--'];
const ALLOWED_ATTRIBUTE_NAMES = [
  // Typeform
  'data-qa',
  // Hubspot
  'data-test-id',
  // Salto
  // - Seems to use https://docs.cypress.io/guides/references/best-practices
  // - In their file tree, data-cy seems to be more specific:
  //  <div
  //    data-testid="file-tree-node-title"
  //    data-cy="file-tree.../AccountContactRole/AccountContactRoleAnnotations.nacl"
  //  >
  'data-cy',
  'data-testid',
];

// Matches name ending with combination of dash and (numbers or letters and numbers)
// We strip everything after the dash when using a matching className/ID
const DASH_NUMBER_REGEX = /^(\D+[-_])([a-z]+\d|\d)/i;
const MIN_PARTIAL_CLASS_OR_ID_LENGTH = 4;

function isNumber(str: string) {
  return /^\d+$/.test(str);
}

// Returns a CSS selector to the element
export const getSelector = (
  target: Element,
  root: Element | Document = document,
  options?: { selectorForNativeScreenshot?: boolean },
) => {
  // User clicked on a Cord target. This attribute should take precedence
  // over everything, as it's set to be unique by our clients.
  const cordTargetValue = target.getAttribute(CORD_TARGET_ATTRIBUTE_NAME);
  if (cordTargetValue) {
    return `[${CORD_TARGET_ATTRIBUTE_NAME}="${cordTargetValue}"]`;
  }

  const isMonacoEditor = isWithinMonacoEditor(target);
  try {
    const rtn = finder(target, {
      attr: (attributeName) => ALLOWED_ATTRIBUTE_NAMES.includes(attributeName),
      stableSelector: (element) => {
        const cordTarget = element.getAttribute(CORD_TARGET_ATTRIBUTE_NAME);
        if (cordTarget) {
          return {
            name: `[${CORD_TARGET_ATTRIBUTE_NAME}="${cordTarget}"]`,
            penalty: 0,
          };
        }

        // Each line of monaco editor has unique a fixed inline style, which looks like
        // `top:0px;height:18px;`. We rely on this to target the exact line.
        if (isMonacoEditor && !options?.selectorForNativeScreenshot) {
          const isLine = isMonacoLine(element);
          if (isLine) {
            return {
              name: getMonacoLineSelector(element)!,
              penalty: 0,
            };
          }
        }

        return null;
      },
      idName: (element) => {
        const elementId = element.getAttribute('id');

        if (elementId) {
          const dashNumberMatch = elementId.match(DASH_NUMBER_REGEX);
          if (dashNumberMatch) {
            if (dashNumberMatch[1].length >= MIN_PARTIAL_CLASS_OR_ID_LENGTH) {
              return {
                // ID begins with
                name: `[id^="${cssesc(dashNumberMatch[1])}"]`,
                penalty: 0,
              };
            } else {
              return null;
            }
          }
          return {
            // Allow numerical IDs
            name: isNumber(elementId)
              ? `[id="${elementId}"]`
              : '#' + cssesc(elementId, { isIdentifier: true }),
            penalty: 0,
          };
        }

        return null;
      },
      classNames: (element) => {
        let classes = Array.from(element.classList);
        // Special styled-components case. Example of styled-components className:
        // "AnimateRoot-sc-__sc-8m2keq-0". The classNames with 'sc-' in are stable
        // for each build (dynamic classNames do not include 'sc-'). The prefix is
        // stable as long as the component name stays the same, so we use that
        if (classes.some((className) => className.includes('sc-'))) {
          classes = classes.filter((className) => className.indexOf('sc-') > 0);
          return classes.map((className) => ({
            // Class* means class contains. We use contains (rather than
            // startsWith) because it's applied to the whole class string (incl
            // multiple classes)
            name: `[class*="${cssesc(
              className.slice(0, className.indexOf('sc-') + 3),
            )}"]`,
            penalty: 1,
          }));
        }

        const classNodes: FinderNode[] = [];
        for (const className of classes) {
          const dashNumberMatch = className.match(DASH_NUMBER_REGEX);
          if (dashNumberMatch) {
            if (dashNumberMatch[1].length >= MIN_PARTIAL_CLASS_OR_ID_LENGTH) {
              classNodes.push({
                name: `[class*="${cssesc(dashNumberMatch[1])}"]`,
                penalty: 1,
              });
            }
          } else if (
            // Only use classname if:
            // - Doesn't include common words for representing state
            // - Doesn't start with 'is', which likely represents state
            // - Isn't exclusively numbers
            !className.startsWith('is') &&
            !EXCLUDED_CLASS_NAMES.find((c) => className.includes(c)) &&
            !isNumber(className)
          ) {
            classNodes.push({
              name: '.' + cssesc(className, { isIdentifier: true }),
              penalty: 1,
            });
          }
        }

        return classNodes;
      },
      optimizedMinLength: 4,
      seedMinLength: 4,
      threshold: getThreshold(root),
      // Lib typing is wrong - this can take Element | Document. The default is
      // document.body - if it is document.body, it sets the root node to the
      // document (see findRootDocument fn). This fails within iframes, because
      // the iframe body is different, hence we set it to document manually
      root: root as any,
    });

    if (rtn.includes(CORD_TARGET_ATTRIBUTE_NAME)) {
      // Get rid of possibly flaky selectors in favour of the stable cord-target one
      // e.g. `"nth-child(2) > [cord-annotation-target="something"] > p` becomes
      // `[cord-annotation-target="something"] > p`
      return rtn.substring(rtn.indexOf(`[${CORD_TARGET_ATTRIBUTE_NAME}`));
    }

    return rtn;
  } catch {
    // Couldn't find a unique selector for the element.
    // This rarely happens, but we shouldn't crash the app if it does.
    return null;
  }
};

function getElementCount(root: Element | Document) {
  return root.querySelectorAll('*').length;
}

// Threshold = max number of selectors to check before falling into nth-child usage.
// Based DOM sizes off:
// - Really big Typeform results page is 21k (only place we noticed this being slow)
// - Phabricator, AWS ~3k
// - Linear 1k
function getThreshold(root: Element | Document) {
  const elementCount = getElementCount(root);
  if (elementCount > 15000) {
    // DOM is huge
    return 0.05 * DEFAULT_THRESHOLD;
  }
  if (elementCount > 7500) {
    // DOM is large
    return 0.25 * DEFAULT_THRESHOLD;
  }
  return DEFAULT_THRESHOLD;
}
