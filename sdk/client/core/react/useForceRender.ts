import { useCallback, useState } from 'react';

// This hook returns a method which, when called, will immediately trigger a
// re-render of that component. This is useful in cases where external events
// indicate the component should be re-rendered, but the data (props) related
// to those events isn't being tracked by React (so that it would re-render
// automatically)
export function useForceRender() {
  const [_lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());
  return useCallback(() => setLastUpdateTimestamp(Date.now()), []);
}
