/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

type PreferenceContextType = {
  clientLanguage: string;
  setClientLanguage: (l: string) => void;
  serverLanguage: string;
  setServerLanguage: (l: string) => void;
};

const noop = () => {};

export const ClientLanguageDisplayNames = {
  REACT: 'React',
  VANILLA_JS: 'Vanilla JavaScript',
  TYPESCRIPT: 'Typescript',
};

export const ServerLanguageDisplayNames = {
  NODE: 'NodeJS',
  GOLANG: 'Golang',
  JAVA: 'Java',
  REST: 'REST',
  BASH: 'bash',
};

const CLIENT_LANGUAGE_LOCAL_STORAGE_KEY = 'cord-docs-client-language';
const SERVER_LANGUAGE_LOCAL_STORAGE_KEY = 'cord-docs-server-language';

const DEFAULT_CLIENT_LANGUAGE = ClientLanguageDisplayNames.REACT;
const DEFAULT_SERVER_LANGUAGE = ServerLanguageDisplayNames.NODE;

export const PreferenceContext = React.createContext<PreferenceContextType>({
  clientLanguage: DEFAULT_CLIENT_LANGUAGE,
  setClientLanguage: noop,
  serverLanguage: DEFAULT_SERVER_LANGUAGE,
  setServerLanguage: noop,
});

type PreferenceContextProviderProps = {
  children: React.ReactNode;
};
function PreferenceContextProvider({
  children,
}: PreferenceContextProviderProps) {
  const [clientLanguage, setClientLanguage] = useState(DEFAULT_CLIENT_LANGUAGE);
  const [serverLanguage, setServerLanguage] = useState(DEFAULT_SERVER_LANGUAGE);

  useEffect(() => {
    const clientLangaugeInLocalStorage = window.localStorage.getItem(
      CLIENT_LANGUAGE_LOCAL_STORAGE_KEY,
    );
    if (
      clientLangaugeInLocalStorage !== null &&
      clientLanguage !== clientLangaugeInLocalStorage
    ) {
      setClientLanguage(clientLangaugeInLocalStorage);
    }

    const serverLangaugeInLocalStorage = window.localStorage.getItem(
      SERVER_LANGUAGE_LOCAL_STORAGE_KEY,
    );
    if (
      serverLangaugeInLocalStorage !== null &&
      serverLanguage !== serverLangaugeInLocalStorage
    ) {
      setServerLanguage(serverLangaugeInLocalStorage);
    }
  }, [clientLanguage, setClientLanguage, serverLanguage, setServerLanguage]);

  const _setClientLanguage = useCallback(
    (cl: string) => {
      if (!Object.values(ClientLanguageDisplayNames).includes(cl)) {
        throw new Error(
          'Trying to set client language to a non-canonical name: ' +
            cl +
            '\n' +
            'Please use one of: ' +
            Object.values(ClientLanguageDisplayNames).join(', '),
        );
      }
      window.localStorage.setItem(CLIENT_LANGUAGE_LOCAL_STORAGE_KEY, cl);
      setClientLanguage(cl);
    },
    [setClientLanguage],
  );

  const _setServerLanguage = useCallback(
    (sl: string) => {
      if (!Object.values(ServerLanguageDisplayNames).includes(sl)) {
        throw new Error(
          'Trying to set server language to a non-canonical name: ' +
            sl +
            '\n' +
            'Please use one of: ' +
            Object.values(ServerLanguageDisplayNames).join(', '),
        );
      }
      window.localStorage.setItem(SERVER_LANGUAGE_LOCAL_STORAGE_KEY, sl);
      setServerLanguage(sl);
    },
    [setServerLanguage],
  );

  return (
    <PreferenceContext.Provider
      value={{
        clientLanguage,
        setClientLanguage: _setClientLanguage,
        serverLanguage,
        setServerLanguage: _setServerLanguage,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export default PreferenceContextProvider;
