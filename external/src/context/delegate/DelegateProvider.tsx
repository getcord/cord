import { useEffect, useMemo, useReducer } from 'react';
import type { NavigateFn } from '@cord-sdk/types';
import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { DelegateReducer } from 'external/src/context/delegate/DelegateReducer.ts';
import type { ThirdPartyInstances } from 'external/src/delegate/annotations/types.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { getThirdPartyObjectsFromInstances } from 'external/src/delegate/annotations/getThirdPartyObjects.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  thirdPartyInstances?: ThirdPartyInstances;
  navigate?: NavigateFn | null;
};

export function DelegateProvider({
  iframeRef,
  thirdPartyInstances,
  navigate,
  children,
}: React.PropsWithChildren<Props>) {
  const [state, dispatch] = useReducer(
    DelegateReducer,
    DO_NOT_EXPORT_InitialDelegateState({
      iframeRef,
      thirdPartyInstances,
      navigate,
    }),
  );

  useEffect(() => {
    dispatch({
      type: 'SET_THIRD_PARTY_OBJECTS',
      thirdPartyObjects: getThirdPartyObjectsFromInstances(thirdPartyInstances),
    });
  }, [thirdPartyInstances]);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return (
    <DelegateContext.Provider value={contextValue}>
      <PageContext.Consumer>
        {(pageContext) => {
          if (pageContext === NO_PROVIDER_DEFINED) {
            // eslint-disable-next-line i18next/no-literal-string
            throw new Error('PageContext not wrapped in provider');
          }
          return pageContext && children;
        }}
      </PageContext.Consumer>
    </DelegateContext.Provider>
  );
}

const DO_NOT_EXPORT_InitialDelegateState = ({
  iframeRef,
  thirdPartyInstances,
  navigate,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  thirdPartyInstances?: ThirdPartyInstances;
  navigate?: NavigateFn | null;
}): DelegateState => {
  return {
    iframeRef,
    annotationArrow: null,
    annotationsVisible: {},
    ready: false,
    scrollingToAnnotation: false,
    confirmModal: null,
    thirdPartyObjects: getThirdPartyObjectsFromInstances(thirdPartyInstances),
    navigate: navigate ?? null,
    deepLinkInfo: null,
    animateAnnotationID: null,
  };
};
