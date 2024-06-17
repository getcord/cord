import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type GlobalElementContextType = {
  setGlobalModal: (
    modalComponent: JSX.Element | null,
    withDarkBackground?: boolean,
  ) => void;
  showToastPopup: (message: string) => void;
  addTopNav: (topNavElement: HTMLDivElement) => void;
  removeTopNav: (topNavElement: HTMLDivElement) => void;
};

export const GlobalElementContext = createContext<
  GlobalElementContextType | typeof NO_PROVIDER_DEFINED | null
>(NO_PROVIDER_DEFINED);
