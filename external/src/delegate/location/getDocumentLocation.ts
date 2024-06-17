import {
  findSuitableElementForDocLocation,
  getTextAtPointConfig,
  isElementSuitableForDocLocation,
  isMediaElement,
  isWebpagePdf,
} from 'external/src/delegate/location/util.ts';
import { getSelector } from 'external/src/lib/getSelector/index.ts';
import type {
  AdditionalTargetData,
  DocumentLocation,
  HighlightedTextConfig,
  LocationTextConfig,
} from 'common/types/index.ts';
import { isElementInChart } from 'external/src/delegate/location/isElementInChart.ts';
import { getElementIdentifier } from 'external/src/delegate/location/elementIdentifier/index.ts';
import { ACTION_MODAL_ID } from 'common/const/ElementIDs.ts';
import type { ThirdPartyObjects } from 'external/src/context/delegate/DelegateContext.ts';

export function getDocumentLocation({
  xVsViewport,
  yVsViewport,
  excludeElementRef,
  logWarning,
  highlightedTextConfig,
  thirdPartyObjects,
  iframeSelectors,
  hashAnnotations = false,
}: {
  xVsViewport: number;
  yVsViewport: number;
  excludeElementRef: React.RefObject<HTMLElement> | null;
  logWarning: (type: string, payload?: any) => void;
  highlightedTextConfig: HighlightedTextConfig | null;
  thirdPartyObjects: ThirdPartyObjects | null;
  iframeSelectors: string[];
  hashAnnotations: boolean;
}): DocumentLocation | null {
  // If pdf, our annotations don't work (we cant see inside)
  // Return null so the annotation is posted with only the screenshot available
  if (isWebpagePdf()) {
    return null;
  }

  // Avoid selecting:
  // - Our shadow DOM. This fixes a rare edge case where it seems that
  //   pointerEvents for the annotation overlay are not turned off in time.
  // - Native screenshot scroll blocker (in place during native screenshot clone)
  let target = document
    .elementsFromPoint(xVsViewport, yVsViewport)
    .find((el) => el.id !== ACTION_MODAL_ID);

  if (!target) {
    logWarning('missing-annotation-target');
    return null;
  }

  let additionalTargetData: AdditionalTargetData | null = null;
  let customTargetSelector: string | null = null;
  let customTargetType: AdditionalTargetData['targetType'] | null = null;
  if (thirdPartyObjects) {
    const { monacoEditors, reactTrees } = thirdPartyObjects;

    if (monacoEditors.isElementInMonacoEditor(target)) {
      const targetData = monacoEditors.getTargetData({
        target,
        xVsViewport,
        yVsViewport,
      });
      additionalTargetData = targetData.additionalTargetData;
      target = targetData.target ?? target;
      if (targetData.targetSelector) {
        customTargetSelector = targetData.targetSelector;
      }
    } else if (reactTrees.isElementInReactTree(target)) {
      const targetData = reactTrees.getTargetData(target);
      additionalTargetData = targetData.additionalTargetData;
      target = targetData.target ?? target;
    }
    customTargetType = additionalTargetData?.targetType ?? null;
  }

  let multimediaConfig = null;
  if (isMediaElement(target)) {
    multimediaConfig = { currentTime: Math.floor(target.currentTime) };
  }

  const windowElement: Window = window;
  const documentElement: Document = document;

  let textAtPointConfig: LocationTextConfig | null = null;
  if (!customTargetType && !highlightedTextConfig) {
    // If pointer is near text (but user hasn't highlighted text), record info
    // that allows us to hook onto the same part of the text later
    textAtPointConfig = getTextAtPointConfig(
      documentElement,
      target,
      xVsViewport,
      yVsViewport,
      hashAnnotations,
    );
  }

  if (
    !customTargetType &&
    !textAtPointConfig &&
    !isElementSuitableForDocLocation(target)
  ) {
    // If no text to hook onto, make sure target is suitable. A large body-type
    // element is unsuitable because position will change with viewport size
    target =
      findSuitableElementForDocLocation(
        documentElement,
        windowElement,
        xVsViewport,
        yVsViewport,
        target,
        excludeElementRef ?? undefined,
      ) ?? target;
  }

  const currentTargetBox = target.getBoundingClientRect();
  // If on chart, we show special icon and notify user that data may have changed
  const onChart = isElementInChart(windowElement, target);
  // We use hash to work out if an item has changed, e.g. its position in list may have changed
  const elementIdentifier = onChart ? undefined : getElementIdentifier(target);

  if (!currentTargetBox.width || !currentTargetBox.height) {
    logWarning('invalid-annotation-target', {
      width: currentTargetBox.width,
      height: currentTargetBox.height,
      element: target.nodeName,
      className: target.className,
      id: target.id,
    });
    return null;
  }

  const targetSelector =
    customTargetSelector ?? getSelector(target, documentElement);
  if (!targetSelector) {
    logWarning('missing-annotation-target-selector', {
      name: target.nodeName,
      id: target.id,
      class: target.className,
    });
    return null;
  }

  return {
    selector: targetSelector,
    x: (xVsViewport - currentTargetBox.x) / currentTargetBox.width,
    y: (yVsViewport - currentTargetBox.y) / currentTargetBox.height,
    iframeSelectors,
    textConfig: textAtPointConfig || null,
    onChart,
    elementIdentifier: elementIdentifier || null,
    highlightedTextConfig,
    multimediaConfig,
    additionalTargetData,
  };
}
