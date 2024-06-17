import {
  createContext,
  useCallback,
  useContext as unsafeUseContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { StylesContext } from '@material-ui/styles';

import type { StyleSheet } from 'jss';
import jsonStableStringify from 'fast-json-stable-stringify';
import { createGenerateId, JssContext } from 'react-jss';
import { create } from 'jss';
import { jssPreset, StylesProvider } from '@material-ui/core';
import { createCordCSS } from 'common/const/Styles.ts';
import type { Styles } from 'common/ui/types.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type Props = {
  children: React.ReactNode;
  rootElement: HTMLElement;
  fontFamily?: string;
  resetCss?: boolean;
};

export function JssInjector({
  children,
  rootElement,
  fontFamily,
  resetCss = true,
}: Props) {
  const hasShadowRoot = rootElement.getRootNode() instanceof ShadowRoot;

  let insertionPoint = rootElement;
  const cordCss = document.getElementById('cord_css');
  if (!hasShadowRoot && cordCss) {
    // Instead of polluting our clients' markup with `<style>` tags,
    // we insert them in the `<head>`
    insertionPoint = cordCss;
  }

  const jss = useMemo(
    () =>
      create({
        ...jssPreset(),
        insertionPoint,
      }),
    [insertionPoint],
  );

  const cordStyles = useMemo(() => {
    const stylesheet = jss.createStyleSheet(createCordCSS(fontFamily));
    return stylesheet.toString();
  }, [jss, fontFamily]);

  const contextValue = useMemo(
    () => ({
      jss,
      sheetOptions: { generateId: createGenerateId() },
      managers: {},
      disableStylesGeneration: false,
    }),
    [jss],
  );

  return (
    <>
      {resetCss && <style>{cordStyles}</style>}
      <JssContext.Provider value={contextValue}>
        <StylesProvider jss={jss}>
          <InjectDynamicStylesProvider>{children}</InjectDynamicStylesProvider>
        </StylesProvider>
      </JssContext.Provider>
    </>
  );
}

export const InjectDynamicStylesContext = createContext<
  ((s: Styles) => string | null) | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

const EMPTY_STYLESHEET = 'EMPTY';
export function InjectDynamicStylesProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  // use StylesContext rather than JssContext because console does not use JssContext
  const { jss } = unsafeUseContext(StylesContext);
  const dynamicStyles = useRef<
    Map<string, StyleSheet<'dynamic'> | typeof EMPTY_STYLESHEET>
  >(new Map());

  const injectDynamicStyles = useCallback(
    (styles: Styles): string | null => {
      if (!jss) {
        // this should never happen
        console.error('jss was null, some styles might be missing');
        return null;
      }
      const key = jsonStableStringify(styles);
      const existing = dynamicStyles.current.get(key);
      if (existing === EMPTY_STYLESHEET) {
        return null;
      } else if (existing) {
        return existing.classes.dynamic;
      } else {
        const newSheet = jss.createStyleSheet(
          { dynamic: styles },
          {
            // style tags injected by jss (and react-jss) are ordered by
            // increasing index value.  react-jss uses MIN_SAFE_INTEGER as the
            // index for its first style tag. Because we want our dynamic style
            // tags to be injected BEFORE the react-jss style tags, we need to
            // use a smaller index here (note that MIN_SAFE_INTEGER is
            // negative). The reason why dynamic styles need to be injected
            // before other styles is so that:
            // <Box2 backgroundColor={"red"} classname={classes.blueBackground} />
            // is BLUE. The above Box2 line uses 2 styles:
            // <style> .dynamic-0-41 { background-color: "red"; } </style>
            // <style> .blueBackground-0-12 { background-color: "blue"; } </style>
            // and the style-tags need to be on the page in this order so that
            // dynamic styles have LOWER specificity. This is the behaviour we
            // had prior to #3710.
            index: 64 * Number.MIN_SAFE_INTEGER, // 64 is arbitrary, any N >= 2 should work

            // add a label <style data-meta="dynamic"> for prettiness
            meta: 'dynamic',
          },
        );
        if (newSheet.toString().trim().length !== 0) {
          newSheet.attach();
          dynamicStyles.current.set(key, newSheet);
          return newSheet.classes.dynamic;
        } else {
          dynamicStyles.current.set(key, EMPTY_STYLESHEET);
          return null;
        }
      }
    },
    [jss],
  );

  useEffect(() => {
    // on detach, remove all dynamic stylesheets
    // TODO: Not sure if this is actually needed or whether JSS would it
    // automatically
    return () => {
      // eslint does not like that I am using a ref in a cleanup function. In
      // this case it's fine because the ref's value never changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const sheet of dynamicStyles.current.values()) {
        if (sheet !== EMPTY_STYLESHEET) {
          sheet.detach();
        }
      }
    };
  }, []);
  return (
    <InjectDynamicStylesContext.Provider value={injectDynamicStyles}>
      {children}
    </InjectDynamicStylesContext.Provider>
  );
}
