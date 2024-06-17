/* eslint-disable no-console */
import { useRef } from 'react';

export function useRenderCountLog(location: string) {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`${location} render count: ${renderCount.current}`);
}
