/** @jsxImportSource @emotion/react */

import * as React from 'react';

type EmbeddingModeContextType = {
  embeddingMode: boolean;
};

export const EmbeddingModeContext =
  React.createContext<EmbeddingModeContextType>({
    embeddingMode: false,
  });

type EmbeddingModeContextProviderProps = {
  embeddingMode: boolean;
  children: React.ReactNode;
};
function EmbeddingModeContextProvider({
  embeddingMode,
  children,
}: EmbeddingModeContextProviderProps) {
  return (
    <EmbeddingModeContext.Provider value={{ embeddingMode }}>
      {children}
    </EmbeddingModeContext.Provider>
  );
}

export default EmbeddingModeContextProvider;
