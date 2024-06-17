import * as React from 'react';
import ReactDOM from 'react-dom';
import { useContext, useMemo, useState } from 'react';
import withReplacement from '../components/hoc/withReplacement.js';
import { ToastPopup } from '../components/toast/ToastPopup.js';
import { PortalContext } from './PortalContext.js';

type ToastContextValue = Partial<{
  showToastPopup: (
    id: string,
    text: string,
    type: 'info' | 'error' | 'success',
  ) => void;
}>;

export const ToastContext = React.createContext<ToastContextValue>({});

// This will add a ToastFunctionProvider if not already a descendant of ToastFunctionProvider.
export const ToastContextProviderPassThrough = ({
  children,
}: React.PropsWithChildren) => {
  // If there is a ToastContext provider above us, we want its value, and wont add yet another provider.
  // E.g. if we're in a Cord message inside a Cord thread, we should portal to the thread.
  const parentValue = useContext(ToastContext);

  if (parentValue.showToastPopup) {
    return <>{children}</>;
  }

  return (
    <ToastFunctionProviderWrapper>{children}</ToastFunctionProviderWrapper>
  );
};

function ToastFunctionProviderWrapper({ children }: React.PropsWithChildren) {
  // We use the PortalContext to get the correct container to render the toast in.
  // Because this is `withCord` put `withPortal` we can assume it exists.
  const toastContainerRef = useContext(PortalContext);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastUpdateCount, setToastUpdateCount] = useState(0);
  const value = useMemo(() => {
    return {
      showToastPopup: (_id: string, text: string) => {
        setToastUpdateCount((prevCount) => prevCount + 1);
        setToastMessage(text);
      },
    };
  }, []);

  return (
    <ToastFunctionProvider canBeReplaced value={value}>
      <>
        {children}
        {toastContainerRef &&
          ReactDOM.createPortal(
            <ToastPopup
              setLabel={setToastMessage}
              label={toastMessage}
              updateCount={toastUpdateCount}
              size={'l'}
            />,
            toastContainerRef,
          )}
      </>
    </ToastFunctionProvider>
  );
}

export type ToastFunctionProviderProps = React.PropsWithChildren<{
  value: ToastContextValue;
}>;

export const ToastFunctionProvider = withReplacement(
  function ToastFunctionProvider({
    children,
    value,
  }: ToastFunctionProviderProps) {
    return (
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    );
  },
  'ToastFunctionProvider',
);
