import { useCallback, useMemo, useState } from 'react';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { DarkModal } from 'external/src/components/DarkModal.tsx';
import { ToastPopup2 } from 'external/src/components/2/ToastPopup2.tsx';
import type { ToastSize } from 'external/src/components/2/ToastPopup2.tsx';

type GlobalElementProviderProps = {
  toastSize?: ToastSize;
};

export const GlobalElementProvider = ({
  children,
  toastSize,
}: React.PropsWithChildren<GlobalElementProviderProps>) => {
  const [modalComponent, setModalComponent] = useState<JSX.Element | null>(
    null,
  );
  const [darkModalVisible, setDarkModalVisible] = useState(false);
  const [successPopupMessage, setSuccessPopupMessage] = useState<string | null>(
    null,
  );
  const [successPopupUpdateCount, setSuccessPopupUpdateCount] = useState(0);

  const [topNavs, setTopNavs] = useState<HTMLDivElement[]>([]);

  const globalElements = useMemo(
    () => (
      <>
        <ToastPopup2
          setLabel={setSuccessPopupMessage}
          label={successPopupMessage}
          updateCount={successPopupUpdateCount}
          topNavElement={topNavs[topNavs.length - 1] ?? null}
          size={toastSize ?? 'l'}
        />
        {darkModalVisible && <DarkModal />}
        {modalComponent}
      </>
    ),
    [
      successPopupMessage,
      successPopupUpdateCount,
      topNavs,
      toastSize,
      darkModalVisible,
      modalComponent,
    ],
  );

  const setGlobalModal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (modalComponent: JSX.Element | null, withDarkBackground?: boolean) => {
      setModalComponent(modalComponent);
      setDarkModalVisible(
        modalComponent !== null && withDarkBackground === true,
      );
    },
    [],
  );

  const showToastPopup = useCallback((message: string) => {
    // Update count triggers update in SuccessPopup even if message is the same
    // This resets the timer so the popup stays another x seconds
    setSuccessPopupUpdateCount((prevCount) => prevCount + 1);
    setSuccessPopupMessage(message);
  }, []);

  const hideToastPopup = useCallback(() => {
    setSuccessPopupUpdateCount((prevCount) => prevCount + 1);
    setSuccessPopupMessage(null);
  }, []);

  // We keep track of whatever topNav is present so that we can position the
  // success popup below topNav. Not always necessary - we currently add the
  // conversation & fullPageThread topNavs
  const addTopNav = useCallback(
    (topNavElement: HTMLDivElement) => {
      setTopNavs((prev) => [...prev, topNavElement]);
      hideToastPopup();
    },
    [hideToastPopup],
  );
  const removeTopNav = useCallback(
    (topNavElement: HTMLDivElement) => {
      setTopNavs((prev) => prev.filter((el) => el !== topNavElement));
      hideToastPopup();
    },
    [hideToastPopup],
  );

  const contextValue = useMemo(
    () => ({
      setGlobalModal,
      showToastPopup,
      addTopNav,
      removeTopNav,
    }),
    [addTopNav, removeTopNav, setGlobalModal, showToastPopup],
  );

  return (
    <GlobalElementContext.Provider value={contextValue}>
      {children}
      <div>{globalElements}</div>
    </GlobalElementContext.Provider>
  );
};
