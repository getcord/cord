import { useEffect, useRef } from 'react';
import { useLogger } from 'external/src/logging/useLogger.ts';

// A hook that look into the document stylesheet and check if there are selector target cord components
//
// - .cord-component we want to slightly move where we put that class, so we need to know how much of a breaking change it is
//  cord-xxx element, they will go away with the removal of webcomponent in React

// A function that takes a selector as a parameter and returns true if any style sheet uses it, false otherwise
// Courtesy of chat-gpt
function checkSelector(selector: string) {
  // Get the list of style sheets in the document
  const styleSheets = document.styleSheets;
  const matchingSelectors: string[] = [];
  // Loop through the style sheets
  for (const styleSheet of styleSheets) {
    // Get the list of rules in the current style sheet
    try {
      // We do not want to log our own CSS
      if (styleSheet?.href?.includes('sdk.latest.css')) {
        continue;
      }
      const rules = styleSheet.cssRules;
      // Loop through the rules
      for (const rule of rules) {
        if (isCSSStyleRule(rule)) {
          // Get the selector text of the current rule
          const selectorText = rule.selectorText;
          // If the selector text matches the parameter, add it to the results list
          if (selectorText.includes(selector)) {
            matchingSelectors.push(selectorText);
          }
        }
      }
    } catch (e) {
      // Do nothing, it is mostly due to CORS
    }
  }
  return matchingSelectors;
}

function isCSSStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return rule.constructor.name === 'CSSStyleRule';
}

const ARBITRARY_INTERVAL = 1000;
export function useLogCssSelectors() {
  const { logDebug } = useLogger();
  const lastLoggedSelectors = useRef<string[] | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const selectors = checkSelector('cord-');
      if (
        !lastLoggedSelectors.current ||
        selectors.sort().toString() !==
          lastLoggedSelectors.current.sort().toString()
      ) {
        logDebug('cord-css-selectors', {
          selectors,
        });
        lastLoggedSelectors.current = selectors;
      }
    }, ARBITRARY_INTERVAL);

    return () => clearInterval(timer);
  }, [logDebug]);
}
