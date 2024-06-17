import * as React from 'react';
import { useContext } from 'react';

export type IDsType = 'thread' | 'message' | 'user';

export type IDsMap = Partial<Record<IDsType, string>>;

// One could argue that having an object value in a Context is bad for rerender.
// But if any of the id changes, it likely everything changed already.
export const CordIDsContext = React.createContext<IDsMap>({});

export function useCordIDs() {
  return useContext(CordIDsContext);
}
