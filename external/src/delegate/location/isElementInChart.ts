import { Sizes } from 'common/const/Sizes.ts';

const { MIN_CHART_SIZE_PX, MAX_CHART_CONTAINER_SIZE_RATIO } = Sizes;

/*
  Element is in a chart if:
  - It is inside an svg
  - The svg is above a certain minimum size (to avoid picking up icons)
  - 'chart’ can be found in attribute values of svg / any descendants / any similarly sized parents of the svg
*/
export function isElementInChart(windowElement: Window, element: Element) {
  const svg = element.nodeName === 'SVG' ? element : getContainingSvg(element);
  if (!svg) {
    return false;
  }

  const styles = windowElement.getComputedStyle(svg);
  const width = parseInt(styles.width);
  const height = parseInt(styles.height);
  if (width < MIN_CHART_SIZE_PX || height < MIN_CHART_SIZE_PX) {
    return false;
  }

  if (chartInAttributes(svg)) {
    return true;
  }

  // Check similarly sized parents (e.g. Google's charts are wrapped in <div class="chart">)
  let parent = svg.parentElement;
  while (parent) {
    const parentStyles = windowElement.getComputedStyle(parent);
    const parentWidth = parseInt(parentStyles.width);
    const parentHeight = parseInt(parentStyles.height);
    if (
      parentWidth > MAX_CHART_CONTAINER_SIZE_RATIO * width ||
      parentHeight > MAX_CHART_CONTAINER_SIZE_RATIO * height
    ) {
      break;
    }
    if (chartInAttributes(parent)) {
      return true;
    }
    parent = parent.parentElement;
  }

  // Check all descendants
  const svgDescendants = svg.getElementsByTagName('*');
  for (let i = 0; i < svgDescendants.length; i++) {
    if (chartInAttributes(svgDescendants[i])) {
      return true;
    }
  }

  return false;
}

function chartInAttributes(element: Element) {
  const attributes = element.attributes;
  for (const attribute of attributes) {
    if (attribute.name.toLowerCase().includes('chart')) {
      return true;
    }
    if (attribute.value.toLowerCase().includes('chart')) {
      return true;
    }
  }
  return false;
}

function getContainingSvg(element: Element) {
  let currentElement: Element | null = element;
  while (currentElement?.nodeName !== 'svg') {
    if (!currentElement) {
      return null;
    }
    currentElement = currentElement.parentElement;
  }
  return currentElement;
}
