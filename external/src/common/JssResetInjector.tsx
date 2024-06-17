import { create } from 'jss';
import type { PropsWithChildren } from 'react';
import { useRef, useLayoutEffect, useMemo } from 'react';
import { JssProvider } from 'react-jss';
import { jssPreset } from '@material-ui/core';
import { createCordCSS } from 'common/const/Styles.ts';

function prepend(selector: string, prefix: string) {
  return selector
    .split(', ')
    .map((part) => {
      if (part.startsWith(prefix)) {
        return part;
      } else {
        return prefix + part;
      }
    })
    .join(', ');
}

type Props = {
  rootElement: HTMLElement;
  rootElementID: string;
};

export function JssResetInjector({
  children,
  rootElement,
  rootElementID,
}: PropsWithChildren<Props>) {
  const jssInsertionPointElement = useRef<HTMLDivElement | null>(null);
  const jss = useMemo(() => {
    // Inserting styles by default adds style tags after the root element (i.e. as siblings).
    // This changes the HTML structure and our annotations' `:nth-child` selectors break.
    // Instead, we insert the styles inside the rootElement to avoid that.
    jssInsertionPointElement.current = document.createElement('div');
    rootElement.appendChild(jssInsertionPointElement.current);
    const prefix = `:where(#${rootElementID}) `;
    return create({
      plugins: [
        ...jssPreset().plugins,
        {
          onProcessRule(rule: any) {
            if (
              rule.type !== 'style' ||
              rule.selectorText === `:where(#${rootElementID})`
            ) {
              return;
            }

            rule.selectorText = prepend(rule.selectorText, prefix);
          },
        },
      ],
      insertionPoint: jssInsertionPointElement.current,
    });
  }, [rootElement, rootElementID]);

  useLayoutEffect(() => {
    const stylesheet = jss.createStyleSheet(
      createCordCSS('inherit', {
        '*, *::before, *::after': { all: 'revert' },
        [`#${rootElementID}`]: {
          all: 'revert',
        },
      }),
    );

    stylesheet.attach();
    return () => {
      stylesheet.detach();
      jssInsertionPointElement.current?.remove();
    };
  }, [jss, rootElementID]);

  return <JssProvider jss={jss}>{children}</JssProvider>;
}
