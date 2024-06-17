import type { ThirdPartyInstances } from 'external/src/delegate/annotations/types.ts';
import { MonacoEditors } from 'external/src/delegate/annotations/MonacoEditors.ts';
import { ReactTrees } from 'external/src/delegate/annotations/ReactTrees.ts';
import type { ThirdPartyObjects } from 'external/src/context/delegate/DelegateContext.ts';

export function getThirdPartyObjectsFromInstances(
  thirdPartyInstances?: ThirdPartyInstances,
): ThirdPartyObjects {
  if (!thirdPartyInstances) {
    return { reactTrees: new ReactTrees(), monacoEditors: new MonacoEditors() };
  }

  return {
    reactTrees: thirdPartyInstances.reactTrees,
    monacoEditors: thirdPartyInstances.monacoEditors,
  };
}
